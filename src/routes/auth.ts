import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { AuthService } from "../services/auth";
import { setCookie, deleteCookie } from "hono/cookie";
import { getSessionCookieConfig } from "../config/auth";
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
    const result = await authService.register(data);

    if (!result.success) {
      return c.json({ error: result.error }, result.status as any);
    }

    const cookieConfig = getSessionCookieConfig(c.env);
    setCookie(c, "session", result.sessionToken, cookieConfig);

    return c.json({ success: true }, 201);
  },
);

// POST /v1/auth/login (public with rate limiting)
auth.post("/login", publicRoute, authRateLimit, zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const authService = new AuthService(c.env);
  const result = await authService.login(data);

  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  const cookieConfig = getSessionCookieConfig(c.env);
  setCookie(c, "session", result.sessionToken, cookieConfig);

  return c.json({ success: true });
});

// POST /v1/auth/logout (protected)
auth.post("/logout", authMiddleware, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const authService = new AuthService(c.env);
  const success = await authService.logout(user.sessionId);

  if (!success) {
    return c.json({ error: "Logout failed" }, 500);
  }

  deleteCookie(c, "session", { httpOnly: true, secure: true, sameSite: "Strict" });

  return c.json({ success: true });
});

export default auth;
