import type { AppEnv } from "../types";

// Default auth configuration values
const DEFAULT_JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours in seconds
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Get auth configuration from environment variables with fallback defaults
 */
export function getAuthConfig(env: AppEnv["Bindings"]) {
  return {
    // JWT token expiration (24 hours in seconds)
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ? parseInt(env.JWT_EXPIRES_IN, 10) : DEFAULT_JWT_EXPIRES_IN,
    // Refresh token expiration (7 days in seconds)
    REFRESH_TOKEN_EXPIRES_IN: env.REFRESH_TOKEN_EXPIRES_IN
      ? parseInt(env.REFRESH_TOKEN_EXPIRES_IN, 10)
      : DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
  } as const;
}

/**
 * Get cookie configuration for refresh tokens
 */
export function getRefreshTokenCookieConfig(env: AppEnv["Bindings"]) {
  const authConfig = getAuthConfig(env);
  return {
    httpOnly: true,
    secure: true,
    sameSite: "Strict" as const,
    maxAge: authConfig.REFRESH_TOKEN_EXPIRES_IN,
  };
}
