import { createDatabase } from "../db";
import type { Bindings } from "../types";
import type {
  SessionPayload,
  SessionJWTPayload,
  CreateSessionRequest,
  SessionResult,
  SessionError,
} from "../types/session";
import type { DB } from "../db/types";
import type { Kysely } from "kysely";
import { sign, verify } from "hono/jwt";

export class SessionService {
  private readonly environment: string;
  private readonly db: Kysely<DB>;
  private readonly kv: KVNamespace;
  private readonly jwtSecret: string;

  constructor(env: Bindings) {
    this.db = createDatabase(env.DB);
    this.kv = env.CACHE;
    this.jwtSecret = env.JWT_SECRET;
    this.environment = env.ENVIRONMENT;
  }

  private readonly SESSION_TTL = 20 * 60;
  private readonly SESSION_KV_TTL = 60 * 60;
  private readonly SESSION_NAME = "taskative_session";

  /**
   * Verify and decode session JWT token
   */
  async verifyToken(token: string): Promise<SessionJWTPayload | null> {
    try {
      const payload = await verify(token, this.jwtSecret);
      return payload as unknown as SessionJWTPayload;
    } catch (error) {
      console.error("JWT verification error:", error);
      return null;
    }
  }

  /**
   * Create a new session in D1 and cache it in KV
   */
  async create(data: CreateSessionRequest): Promise<SessionResult | SessionError> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);

    try {
      // Create session in D1
      const session = await this.db
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: data.userId,
          expiresAt: expiresAt.toISOString(),
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

      await this.kv.put(kvKey, kvValue, { expirationTtl: this.SESSION_KV_TTL });

      // Generate a 20-minute JWT tied to this session
      const sessionToken = await this.generateToken({
        sessionId: session.id,
        userId: data.userId,
        email: data.email,
      });

      return { success: true, sessionToken };
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
  async findById(sessionId: string): Promise<SessionPayload | null> {
    try {
      // First check KV cache
      const kvKey = `session:${sessionId}`;
      const kvValue = await this.kv.get(kvKey);

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
      const session = await this.db
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

        await this.kv.put(kvKey, kvValue, { expirationTtl: this.SESSION_KV_TTL });

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
  async revoke(sessionId: string): Promise<boolean> {
    try {
      // Revoke session in D1
      const result = await this.db
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
      await this.kv.delete(kvKey);

      return Number(result.numUpdatedRows) > 0;
    } catch (error) {
      console.error("SessionService.revoke error:", error);
      return false;
    }
  }

  /**
   * Revoke all active sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<boolean> {
    try {
      // First get all active sessions for the user
      const activeSessions = await this.db
        .selectFrom("sessions")
        .select(["id"])
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .execute();

      if (activeSessions.length === 0) {
        return true; // No active sessions to revoke
      }

      // Update all active sessions to revoked status
      const result = await this.db
        .updateTable("sessions")
        .set({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        })
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .execute();

      // Remove all session keys from KV cache
      const deletePromises = activeSessions.map((session) => {
        const kvKey = `session:${session.id}`;
        return this.kv.delete(kvKey);
      });

      await Promise.all(deletePromises);

      return true;
    } catch (error) {
      console.error("SessionService.revokeAllUserSessions error:", error);
      return false;
    }
  }

  /**
   * Get session cookie configuration
   */
  getSessionCookieConfig() {
    return {
      name: this.SESSION_NAME,
      options: {
        httpOnly: true,
        secure: this.environment === "production",
        sameSite: "Strict" as const,
        maxAge: this.SESSION_TTL + 5 * 60, // 5 minutes buffer
      },
    };
  }

  /**
   * Generate session JWT token with 20-minute expiration
   */
  async generateToken(payload: SessionPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.SESSION_TTL;

    return sign(
      {
        sessionId: payload.sessionId,
        userId: payload.userId,
        email: payload.email,
        exp: now + expiresIn,
        iat: now,
      },
      this.jwtSecret,
    );
  }
}
