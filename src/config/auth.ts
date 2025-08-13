import type { AppEnv } from "../types";

/**
 * Get auth configuration from environment variables with environment-aware config
 */
export function getAuthConfig(env: AppEnv["Bindings"]) {
  const isdev =
    env.ENVIRONMENT === "development" ||
    env.NODE_ENV === "development" ||
    // If no explicit environment set, assume development
    (!env.ENVIRONMENT && !env.NODE_ENV);

  return {
    // Session JWT token expiration (20 minutes)
    SESSION_JWT_EXPIRES_IN: 20 * 60, // 20 minutes in seconds
    // Session database expiration (longer than JWT for renewal)
    SESSION_DB_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days in seconds
    // Environment info
    IS_DEVELOPMENT: isdev,
  } as const;
}

/**
 * Get cookie configuration for session tokens with environment-aware settings
 */
export function getSessionCookieConfig(env: AppEnv["Bindings"]) {
  const authConfig = getAuthConfig(env);
  return {
    httpOnly: true,
    secure: !authConfig.IS_DEVELOPMENT, // false for dev, true for prod
    sameSite: "Strict" as const,
    maxAge: authConfig.SESSION_JWT_EXPIRES_IN, // 20 minutes
  };
}
