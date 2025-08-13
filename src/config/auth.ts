import type { AppEnv } from "../types";

// Environment-specific configuration values
const PROD_CONFIG = {
  JWT_EXPIRES_IN: 60 * 60 * 24, // 24 hours in seconds
  REFRESH_TOKEN_EXPIRES_IN: 60 * 60 * 24 * 15, // 15 days in seconds
};

const DEV_CONFIG = {
  JWT_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days in seconds (longer for dev)
  REFRESH_TOKEN_EXPIRES_IN: 60 * 60 * 24 * 30, // 30 days in seconds (longer for dev)
};

/**
 * Get auth configuration from environment variables with environment-aware config
 */
export function getAuthConfig(env: AppEnv["Bindings"]) {
  const isdev =
    env.ENVIRONMENT === "development" ||
    env.NODE_ENV === "development" ||
    // If no explicit environment set, assume development
    (!env.ENVIRONMENT && !env.NODE_ENV);
  const config = isdev ? DEV_CONFIG : PROD_CONFIG;

  return {
    // JWT token expiration
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN,
    // Refresh token expiration
    REFRESH_TOKEN_EXPIRES_IN: config.REFRESH_TOKEN_EXPIRES_IN,
    // Environment info
    IS_DEVELOPMENT: isdev,
  } as const;
}

/**
 * Get cookie configuration for refresh tokens with environment-aware settings
 */
export function getRefreshTokenCookieConfig(env: AppEnv["Bindings"]) {
  const authConfig = getAuthConfig(env);
  return {
    httpOnly: true,
    secure: !authConfig.IS_DEVELOPMENT, // false for dev, true for prod
    sameSite: "Strict" as const,
    maxAge: authConfig.REFRESH_TOKEN_EXPIRES_IN,
  };
}
