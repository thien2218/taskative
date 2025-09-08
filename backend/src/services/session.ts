import type { Bindings } from "@/types";
import type {
  SessionPayload,
  SessionJWTPayload,
  CreateSessionRequest,
  SessionResult,
  SessionError,
} from "@/types/session";
import type { DB } from "@/db/types";
import type { Kysely } from "kysely";
import { sign, verify } from "hono/jwt";
import type DatabaseService from "@/services/database";
import CacheService from "@/services/cache";

class SessionService {
  private readonly environment: string;
  private readonly db: Kysely<DB>;
  private readonly cache: CacheService;
  private readonly jwtSecret: string;

  constructor(deps: { dbService: DatabaseService; cache: CacheService; config: Bindings }) {
    this.db = deps.dbService.db;
    this.cache = deps.cache;
    this.jwtSecret = deps.config.JWT_SECRET;
    this.environment = deps.config.ENVIRONMENT;
  }

  private readonly SESSION_TTL = 30 * 60;
  private readonly SESSION_KV_TTL = 60 * 60;

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
      const session = await this.db
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: data.userId,
          deviceId: data.deviceId ?? "unknown-device",
          deviceName: data.deviceName ?? "Unknown Device",
          expiresAt: expiresAt.toISOString(),
        })
        .returning([
          "id",
          "userId",
          "status",
          "createdAt",
          "expiresAt",
          "revokedAt",
          "deviceId",
          "deviceName",
        ])
        .executeTakeFirst();

      if (!session) {
        return {
          success: false,
          error: "Failed to create session",
        };
      }

      // Cache session with TTL
      const kvKey = `session:${sessionId}`;
      await this.cache.set(
        kvKey,
        {
          userId: data.userId,
          email: data.email,
          status: session.status,
          expiresAt: session.expiresAt,
          deviceId: session.deviceId,
          deviceName: session.deviceName,
        },
        this.SESSION_KV_TTL,
      );

      // Generate a 30-minute JWT tied to this session
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
      const kvValue = await this.cache.get<any>(kvKey);

      if (kvValue) {
        const sessionData = kvValue;
        // Check if session is still active and not expired
        if (sessionData.status === "active" && new Date(sessionData.expiresAt) > new Date()) {
          return {
            sessionId,
            userId: sessionData.userId,
            email: sessionData.email,
            deviceId: sessionData.deviceId ?? "unknown-device",
            deviceName: sessionData.deviceName ?? "Unknown",
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
          "sessions.deviceId",
          "sessions.deviceName",
          "users.email",
        ])
        .where("sessions.id", "=", sessionId)
        .where("sessions.status", "=", "active")
        .where("sessions.expiresAt", ">", new Date().toISOString())
        .executeTakeFirst();

      if (session) {
        // Refresh KV cache
        await this.cache.set(
          kvKey,
          {
            userId: session.userId,
            email: session.email,
            status: session.status,
            expiresAt: session.expiresAt,
            deviceId: session.deviceId,
            deviceName: session.deviceName,
          },
          this.SESSION_KV_TTL,
        );

        return {
          sessionId: session.id,
          userId: session.userId,
          email: session.email,
          deviceId: session.deviceId,
          deviceName: session.deviceName,
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
      await this.cache.del(kvKey);

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
      await this.db
        .updateTable("sessions")
        .set({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        })
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .execute();

      // Remove all session keys from KV cache
      const keys = activeSessions.map((session) => `session:${session.id}`);
      await this.cache.mdelete(keys);

      return true;
    } catch (error) {
      console.error("SessionService.revokeAllUserSessions error:", error);
      return false;
    }
  }

  /**
   * Revoke all active sessions for a user EXCEPT the specified session
   */
  async revokeUserOtherSessions(userId: string, excludeSessionId: string): Promise<boolean> {
    try {
      // First get all active sessions for the user except the excluded one
      const activeSessions = await this.db
        .selectFrom("sessions")
        .select(["id"])
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .where("id", "!=", excludeSessionId)
        .execute();

      if (activeSessions.length === 0) {
        return true; // No other sessions to revoke
      }

      // Update sessions to revoked status
      await this.db
        .updateTable("sessions")
        .set({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        })
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .where("id", "!=", excludeSessionId)
        .execute();

      // Remove session keys from KV cache
      const keys = activeSessions.map((session) => `session:${session.id}`);
      await this.cache.mdelete(keys);

      return true;
    } catch (error) {
      console.error("SessionService.revokeUserOtherSessions error:", error);
      return false;
    }
  }

  /**
   * Revoke specific sessions by IDs for a user
   */
  async revokeSessionsByIds(
    userId: string,
    sessionIds: string[],
  ): Promise<{ success: boolean; revokedCurrentSession?: boolean }> {
    try {
      if (sessionIds.length === 0) {
        return { success: true, revokedCurrentSession: false };
      }

      // First get the sessions that exist and are active for this user
      const existingSessions = await this.db
        .selectFrom("sessions")
        .select(["id"])
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .where("id", "in", sessionIds)
        .execute();

      if (existingSessions.length === 0) {
        return { success: true, revokedCurrentSession: false };
      }

      const existingSessionIds = existingSessions.map((s) => s.id);

      // Update sessions to revoked status
      await this.db
        .updateTable("sessions")
        .set({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        })
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .where("id", "in", existingSessionIds)
        .execute();

      // Remove session keys from KV cache
      const keys = existingSessionIds.map((sessionId) => `session:${sessionId}`);
      await this.cache.mdelete(keys);

      // Check if any of the revoked sessions is the current session
      // We don't have access to current session here, so we return the IDs
      // and let the caller determine if current session was included
      return {
        success: true,
        revokedCurrentSession: false, // This will be determined by the route handler
      };
    } catch (error) {
      console.error("SessionService.revokeSessionsByIds error:", error);
      return { success: false };
    }
  }

  /**
   * Get session cookie configuration
   */
  getSessionCookieConfig() {
    return {
      httpOnly: true,
      secure: this.environment === "production",
      sameSite: "Strict" as const,
      maxAge: this.SESSION_TTL,
    };
  }

  /**
   * Generate session JWT token with 30-minute expiration
   */
  async generateToken(
    payload: Pick<SessionPayload, "sessionId" | "userId" | "email">,
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return sign(
      {
        sessionId: payload.sessionId,
        userId: payload.userId,
        email: payload.email,
        exp: now + this.SESSION_TTL,
        iat: now,
      },
      this.jwtSecret,
    );
  }
}

export default SessionService;
export { SessionService };
