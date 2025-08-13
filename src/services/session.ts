import { createDatabase } from "../db";
import type { AppEnv } from "../types";
import type { Session } from "../db/types";

export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
}

export interface CreateSessionRequest {
  userId: string;
  email: string;
  expiresAt: Date;
}

export interface SessionResult {
  success: true;
  session: Session;
}

export interface SessionError {
  success: false;
  error: string;
}

export class SessionService {
  /**
   * Create a new session in D1 and cache it in KV
   */
  static async create(
    data: CreateSessionRequest,
    env: AppEnv["Bindings"],
  ): Promise<SessionResult | SessionError> {
    const db = createDatabase(env);
    const sessionId = crypto.randomUUID();

    try {
      // Create session in D1
      const session = await db
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: data.userId,
          status: "active",
          createdAt: new Date().toISOString(),
          expiresAt: data.expiresAt.toISOString(),
          revokedAt: null,
        })
        .returning(["id", "userId", "status", "createdAt", "expiresAt", "revokedAt"])
        .executeTakeFirst();

      if (!session) {
        return {
          success: false,
          error: "Failed to create session",
        };
      }

      // Cache session in KV with TTL
      const kvKey = `session:${sessionId}`;
      const kvValue = JSON.stringify({
        userId: data.userId,
        email: data.email,
        status: session.status,
        expiresAt: session.expiresAt,
      });

      // Calculate TTL in seconds (20 minutes = 1200 seconds)
      const ttlSeconds = 20 * 60;
      await env.SESSION_KV.put(kvKey, kvValue, { expirationTtl: ttlSeconds });

      return {
        success: true,
        session,
      };
    } catch (error) {
      console.error("SessionService.create error:", error);
      return {
        success: false,
        error: "Failed to create session",
      };
    }
  }

  /**
   * Find session by ID, checking KV first, then D1
   */
  static async findById(
    sessionId: string,
    env: AppEnv["Bindings"],
  ): Promise<SessionPayload | null> {
    try {
      // First check KV cache
      const kvKey = `session:${sessionId}`;
      const kvValue = await env.SESSION_KV.get(kvKey);

      if (kvValue) {
        const sessionData = JSON.parse(kvValue);
        // Check if session is still active and not expired
        if (sessionData.status === "active" && new Date(sessionData.expiresAt) > new Date()) {
          return {
            sessionId,
            userId: sessionData.userId,
            email: sessionData.email,
          };
        }
      }

      // If not in KV or expired, check D1
      const db = createDatabase(env);
      const session = await db
        .selectFrom("sessions")
        .innerJoin("users", "sessions.userId", "users.id")
        .select([
          "sessions.id",
          "sessions.userId",
          "sessions.status",
          "sessions.expiresAt",
          "users.email",
        ])
        .where("sessions.id", "=", sessionId)
        .where("sessions.status", "=", "active")
        .where("sessions.expiresAt", ">", new Date().toISOString())
        .executeTakeFirst();

      if (session) {
        // Refresh KV cache
        const kvValue = JSON.stringify({
          userId: session.userId,
          email: session.email,
          status: session.status,
          expiresAt: session.expiresAt,
        });
        const ttlSeconds = 20 * 60;
        await env.SESSION_KV.put(kvKey, kvValue, { expirationTtl: ttlSeconds });

        return {
          sessionId: session.id,
          userId: session.userId,
          email: session.email,
        };
      }

      return null;
    } catch (error) {
      console.error("SessionService.findById error:", error);
      return null;
    }
  }

  /**
   * Revoke session in D1 and remove from KV
   */
  static async revoke(sessionId: string, env: AppEnv["Bindings"]): Promise<boolean> {
    try {
      const db = createDatabase(env);

      // Revoke session in D1
      const result = await db
        .updateTable("sessions")
        .set({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        })
        .where("id", "=", sessionId)
        .where("status", "=", "active")
        .executeTakeFirst();

      // Remove from KV cache
      const kvKey = `session:${sessionId}`;
      await env.SESSION_KV.delete(kvKey);

      return Number(result.numUpdatedRows) > 0;
    } catch (error) {
      console.error("SessionService.revoke error:", error);
      return false;
    }
  }

  /**
   * Helper to serialize session payload for JWT claims
   */
  static serializeForJWT(sessionPayload: SessionPayload): SessionPayload {
    return {
      sessionId: sessionPayload.sessionId,
      userId: sessionPayload.userId,
      email: sessionPayload.email,
    };
  }
}
