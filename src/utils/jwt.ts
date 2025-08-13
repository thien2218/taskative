import { sign, verify } from "hono/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { getSessionCookieConfig } from "../config/auth";
import type { Context } from "hono";
import type { AppEnv } from "../types";
import type { SessionPayload } from "../services/session";

export interface SessionJWTPayload {
  sessionId: string;
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

/**
 * Generate session JWT token with 20-minute expiration
 */
export async function generateSessionToken(
  sessionPayload: SessionPayload,
  env: AppEnv["Bindings"],
): Promise<string> {
  const secret = env.JWT_SECRET;
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 20 * 60; // 20 minutes in seconds

  return sign(
    {
      sessionId: sessionPayload.sessionId,
      userId: sessionPayload.userId,
      email: sessionPayload.email,
      exp: now + expiresIn,
      iat: now,
    },
    secret,
  );
}

/**
 * Verify and decode session JWT token
 */
export async function verifySessionToken(
  token: string,
  env: AppEnv["Bindings"],
): Promise<SessionJWTPayload | null> {
  try {
    const secret = env.JWT_SECRET;
    const payload = await verify(token, secret);

    if (
      typeof payload === "object" &&
      payload &&
      "sessionId" in payload &&
      "userId" in payload &&
      "email" in payload
    ) {
      return payload as unknown as SessionJWTPayload;
    }

    return null;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

/**
 * Helper function to set session token cookie
 */
export function setSessionTokenCookie(
  c: Context,
  sessionToken: string,
  env: AppEnv["Bindings"],
): void {
  const cookieConfig = getSessionCookieConfig(env);
  setCookie(c, "session", sessionToken, cookieConfig);
}

/**
 * Helper function to clear session token cookie
 */
export function clearSessionTokenCookie(c: Context): void {
  deleteCookie(c, "session", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });
}

/**
 * Helper function to get session token from cookie
 */
export function getSessionTokenFromCookie(c: Context): string | undefined {
  return getCookie(c, "session");
}
