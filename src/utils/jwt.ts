import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { getAuthConfig, getRefreshTokenCookieConfig } from "../config/auth";
import type { Context } from "hono";
import type { AppEnv } from "../types";

export interface JWTPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  type: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate both access and refresh tokens with consistent timestamps
 * This ensures both tokens share the same iat (issued at) timestamp
 */
export async function generateTokenPair(
  payload: JWTPayload,
  env: AppEnv["Bindings"],
): Promise<TokenPair> {
  const config = getAuthConfig(env);
  const secret = env.JWT_SECRET;
  const now = Math.floor(Date.now() / 1000);

  // Generate both tokens in parallel with consistent timestamps
  const [accessToken, refreshToken] = await Promise.all([
    // Access token with user data
    sign(
      {
        ...payload,
        exp: now + config.JWT_EXPIRES_IN,
        iat: now,
      },
      secret,
    ),
    // Refresh token with minimal payload
    sign(
      {
        userId: payload.userId,
        tokenVersion: payload.tokenVersion,
        type: "refresh",
        exp: now + config.REFRESH_TOKEN_EXPIRES_IN,
        iat: now,
      },
      secret,
    ),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Helper function to set refresh token cookie
 * Eliminates code duplication between register and login endpoints
 */
export function setRefreshTokenCookie(
  c: Context,
  refreshToken: string,
  env: AppEnv["Bindings"],
): void {
  const cookieConfig = getRefreshTokenCookieConfig(env);
  setCookie(c, "refreshToken", refreshToken, cookieConfig);
}
