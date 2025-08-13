import { createDatabase } from "../db";
import type { AppEnv } from "../types";
import type { Session, DB } from "../db/types";
import type { Kysely } from "kysely";
import { sign, verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { getSessionCookieConfig } from "../config/auth";
import type { Context } from "hono";

export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
}

export interface SessionJWTPayload {
  sessionId: string;
  userId: string;
  email: string;
  exp: number;
  iat: number;
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
  private readonly db: Kysely<DB>;
  private readonly kv: KVNamespace;
  private readonly jwtSecret: string;

  constructor(env: AppEnv["Bindings"]) {
    this.db = createDatabase(env.DB);
    this.kv = env.SESSION_KV;
    this.jwtSecret = env.JWT_SECRET;
  }

  private static readonly SESSION_TTL = 20 * 60;
  private static readonly SESSION_KV_TTL = 60 * 60;
  private static readonly SESSION_COOKIE_NAME = "session";

  /**
   * Generate session JWT token with 20-minute expiration
   */
  async generateToken(sessionPayload: SessionPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = SessionService.SESSION_TTL;

    return sign(
      {
        sessionId: sessionPayload.sessionId,
        userId: sessionPayload.userId,
        email: sessionPayload.email,
        exp: now + expiresIn,
        iat: now,
      },
      this.jwtSecret,
    );
  }

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
   * Helper function to set session token cookie
   */
  setTokenCookie(c: Context, sessionToken: string): void {
    const cookieConfig = getSessionCookieConfig(c.env);
    setCookie(c, SessionService.SESSION_COOKIE_NAME, sessionToken, cookieConfig);
  }

  /**
   * Helper function to clear session token cookie
   */
  clearTokenCookie(c: Context): void {
    deleteCookie(c, SessionService.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
  }

  /**
   * Helper function to get session token from cookie
   */
  getTokenFromCookie(c: Context): string | undefined {
    return getCookie(c, SessionService.SESSION_COOKIE_NAME);
  }
  /**
   * Create a new session in D1 and cache it in KV
   */
  async create(data: CreateSessionRequest): Promise<SessionResult | SessionError> {
    const sessionId = crypto.randomUUID();

    try {
      // Create session in D1
      const session = await this.db
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: data.userId,
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

      const ttlSeconds = SessionService.SESSION_KV_TTL;
      await this.kv.put(kvKey, kvValue, { expirationTtl: ttlSeconds });

      return { success: true, session: session as unknown as Session };
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
        const ttlSeconds = SessionService.SESSION_KV_TTL;
        await this.kv.put(kvKey, kvValue, { expirationTtl: ttlSeconds });

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
}
