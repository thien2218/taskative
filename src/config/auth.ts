import type { AppEnv } from "../types";

/**
 * Get cookie configuration for session tokens with environment-aware settings
 */
export function getSessionCookieConfig(env: Bindings) {
  return {
    httpOnly: true,
    secure: env.ENVIRONMENT === "production",
    sameSite: "Strict" as const,
    maxAge: 25 * 60, // 20 minutes + 5 minutes buffer
  };
}
