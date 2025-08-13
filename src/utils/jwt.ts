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

export async function signJWT(
  payload: JWTPayload,
  secret: string,
  env: AppEnv["Bindings"],
): Promise<string> {
  const config = getAuthConfig(env);
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + config.JWT_EXPIRES_IN,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
  );
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
  env: AppEnv["Bindings"],
): Promise<string> {
  const config = getAuthConfig(env);
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + config.REFRESH_TOKEN_EXPIRES_IN,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
  );
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
