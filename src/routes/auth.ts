import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie } from "hono/cookie";
import { AuthService } from "../services/auth";
import { getRefreshTokenCookieConfig } from "../config/auth";
import { registerSchema, loginSchema } from "../validators/auth";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

// POST /v1/auth/register
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await AuthService.register(data, c.env);

  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  // Set refresh token cookie
  const cookieConfig = getRefreshTokenCookieConfig(c.env);
  setCookie(c, "refreshToken", result.refreshToken, cookieConfig);

  return c.json({ success: true, token: result.token }, 201);
});

// POST /v1/auth/login
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await AuthService.login(data, c.env);

  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  // Set refresh token cookie
  const cookieConfig = getRefreshTokenCookieConfig(c.env);
  setCookie(c, "refreshToken", result.refreshToken, cookieConfig);

  return c.json({ success: true, token: result.token });
});

export default auth;
