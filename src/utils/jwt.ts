import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { AUTH_CONFIG, REFRESH_TOKEN_COOKIE_CONFIG } from "../config/auth";
import type { Context } from "hono";

export interface JWTPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + AUTH_CONFIG.JWT_EXPIRES_IN,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
  );
}

export function generateRefreshToken(): string {
  return crypto.randomUUID();
}

/**
 * Helper function to set refresh token cookie
 * Eliminates code duplication between register and login endpoints
 */
export function setRefreshTokenCookie(c: Context, refreshToken: string): void {
  setCookie(c, "refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_CONFIG);
}
