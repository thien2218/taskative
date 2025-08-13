import type { Context, Next } from "hono";
import type { AppEnv } from "../types";

/**
 * Rate limiting middleware using Cloudflare Rate Limiting binding
 * Docs: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */
export async function authRateLimit(c: Context<AppEnv>, next: Next) {
  // Define a stable key for rate limiting. Prefer a user identifier when available
  // Fallback to route path to avoid over-limiting by IP (per Cloudflare best practices)
  const url = new URL(c.req.url);
  const user = c.get("user");
  const limiterKey = user?.userId ? `user:${user.userId}` : `path:${url.pathname}`;

  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: limiterKey });

  if (!success) {
    return c.json({ error: "Too many requests" }, 429);
  }

  return next();
}
