import type { Context, Next } from "hono";
import type { AppEnv } from "../types";
import {
  getSessionTokenFromCookie,
  verifySessionToken,
  generateSessionToken,
  setSessionTokenCookie,
} from "../utils/jwt";
import { SessionService } from "../services/session";

/**
 * Authentication middleware for session-backed JWT cookies
 *
 * Flow:
 * 1. Extract JWT from cookie
 * 2. Verify JWT signature and expiration
 * 3. If valid, attach user info to context and continue
 * 4. If expired, extract session info and check KV/D1
 * 5. If session is valid, issue new 20-minute cookie and continue
 * 6. Otherwise return 401 Unauthorized
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionToken = getSessionTokenFromCookie(c);

  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Try to verify the current JWT
  const jwtPayload = await verifySessionToken(sessionToken, c.env);

  if (jwtPayload) {
    // JWT is valid and not expired
    c.set("user", {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      sessionId: jwtPayload.sessionId,
    });
    return next();
  }

  // JWT is invalid or expired, try to renew using session
  try {
    // Extract session ID from the expired/invalid token (unsafe decode)
    const base64Payload = sessionToken.split(".")[1];
    if (!base64Payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const decodedPayload = JSON.parse(atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/")));

    if (!decodedPayload.sessionId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if session is still valid
    const sessionPayload = await SessionService.findById(decodedPayload.sessionId, c.env);

    if (!sessionPayload) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Session is valid, generate new JWT cookie
    const newSessionToken = await generateSessionToken(sessionPayload, c.env);
    setSessionTokenCookie(c, newSessionToken, c.env);

    // Attach user info to context
    c.set("user", {
      userId: sessionPayload.userId,
      email: sessionPayload.email,
      sessionId: sessionPayload.sessionId,
    });

    return next();
  } catch (error) {
    console.error("Auth middleware renewal error:", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
}

/**
 * Optional authentication middleware - does not return 401 if no auth
 * Used for endpoints that work with or without authentication
 */
export async function optionalAuthMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionToken = getSessionTokenFromCookie(c);

  if (!sessionToken) {
    return next();
  }

  // Try to verify the current JWT
  const jwtPayload = await verifySessionToken(sessionToken, c.env);

  if (jwtPayload) {
    // JWT is valid and not expired
    c.set("user", {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      sessionId: jwtPayload.sessionId,
    });
    return next();
  }

  // For optional auth, don't try renewal - just continue without user
  return next();
}
