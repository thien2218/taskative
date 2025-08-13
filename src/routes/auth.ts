import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { AuthService } from "../services/auth";
import { SessionService } from "../services/session";
import { authMiddleware } from "../middlewares/auth";
import { publicRoute } from "../middlewares/public";
import { authRateLimit } from "../middlewares/rate-limiter";
import { registerSchema, loginSchema } from "../validators/auth";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

// POST /v1/auth/register (public with rate limiting)
auth.post(
  "/register",
  publicRoute,
  authRateLimit,
  zValidator("json", registerSchema),
  async (c) => {
    const data = c.req.valid("json");
    const authService = new AuthService(c.env);
    const sessionService = new SessionService(c.env);
    const result = await authService.register(data);

    if (!result.success) {
      return c.json({ error: result.error }, result.status as any);
    }

    sessionService.setTokenCookie(c, result.sessionToken);

    return c.json({ success: true }, 201);
  },
);

// POST /v1/auth/login (public with rate limiting)
auth.post("/login", publicRoute, authRateLimit, zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const authService = new AuthService(c.env);
  const sessionService = new SessionService(c.env);
  const result = await authService.login(data);

  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  sessionService.setTokenCookie(c, result.sessionToken);

  return c.json({ success: true });
});

// POST /v1/auth/logout (protected)
auth.post("/logout", authMiddleware, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const authService = new AuthService(c.env);
  const sessionService = new SessionService(c.env);
  const success = await authService.logout(user.sessionId);

  if (!success) {
    return c.json({ error: "Logout failed" }, 500);
  }

  sessionService.clearTokenCookie(c);

  return c.json({ success: true });
});

export default auth;
