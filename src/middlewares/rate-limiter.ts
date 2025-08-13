import type { Context, Next } from "hono";
import type { AppEnv } from "../types";

// In-memory rate limiting store (for demo - in production use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware for auth endpoints
 * Limits to 5 requests per 15 minutes per IP address
 */
export function authRateLimit(c: Context<AppEnv>, next: Next) {
  const clientIP =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    c.req.header("X-Real-IP") ||
    "unknown";

  const key = `auth:${clientIP}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  // Get current rate limit data for this IP
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    const resetInSeconds = Math.ceil((current.resetTime - now) / 1000);
    return c.json(
      {
        error: "Too many requests",
        retryAfter: resetInSeconds,
      },
      429,
      {
        "Retry-After": resetInSeconds.toString(),
      },
    );
  }

  // Increment counter
  current.count += 1;
  rateLimitStore.set(key, current);

  return next();
}

/**
 * Cleanup expired entries from rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 30 minutes
setInterval(cleanupRateLimit, 30 * 60 * 1000);
