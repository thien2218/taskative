// Password hashing configuration
export const AUTH_CONFIG = {
  // Bcrypt salt rounds for password hashing
  SALT_ROUNDS: 11,
  // JWT token expiration (24 hours in seconds)
  JWT_EXPIRES_IN: 60 * 60 * 24,
  // Refresh token expiration (7 days in seconds)
  REFRESH_TOKEN_EXPIRES_IN: 60 * 60 * 24 * 7,
} as const;

// Cookie configuration for refresh tokens
export const REFRESH_TOKEN_COOKIE_CONFIG = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict" as const,
  maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
};
