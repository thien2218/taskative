import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { AuthService } from "@/services/auth";
import { setCookie, deleteCookie } from "hono/cookie";
import { authMiddleware, authRateLimit, unauthMiddleware } from "@/middlewares";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from "@/validators/auth";
import type { AppEnv } from "@/types";
import { SessionService } from "@/services/session";

const auth = new Hono<AppEnv>();

// POST /v1/auth/register (public with rate limiting)
auth.post(
  "/register",
  unauthMiddleware,
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

    const cookieConfig = sessionService.getSessionCookieConfig();
    setCookie(c, c.env.SESSION_NAME, result.sessionToken, cookieConfig);

    return c.json({ success: true }, 201);
  },
);

// POST /v1/auth/login (public with rate limiting)
auth.post("/login", unauthMiddleware, authRateLimit, zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const authService = new AuthService(c.env);
  const sessionService = new SessionService(c.env);

  const result = await authService.login(data);

  if (!result.success) {
    return c.json({ error: result.error }, result.status as any);
  }

  const cookieConfig = sessionService.getSessionCookieConfig();
  setCookie(c, c.env.SESSION_NAME, result.sessionToken, cookieConfig);

  return c.json({ success: true });
});

// POST /v1/auth/logout (protected)
auth.post("/logout", authMiddleware, zValidator("json", logoutSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const { mode = "current", sessionIds } = data;

  const sessionService = new SessionService(c.env);
  let success = false;
  let shouldClearCookie = false;

  switch (mode) {
    case "current":
      success = await sessionService.revoke(user.sessionId);
      shouldClearCookie = true;
      break;

    case "others":
      success = await sessionService.revokeOtherSessionsForUser(user.userId, user.sessionId);
      shouldClearCookie = false; // Keep current session cookie
      break;

    case "all":
      success = await sessionService.revokeAllUserSessions(user.userId);
      shouldClearCookie = true;
      break;

    case "byIds":
      const result = await sessionService.revokeSessionsByIds(user.userId, sessionIds!);
      success = result.success;
      // Clear cookie if current session is in the list
      shouldClearCookie = sessionIds!.includes(user.sessionId);
      break;

    default:
      return c.json({ error: "Invalid logout mode" }, 400);
  }

  if (!success) {
    return c.json({ error: "Logout failed" }, 500);
  }

  // Clear cookie if required by the mode
  if (shouldClearCookie) {
    const cookieConfig = sessionService.getSessionCookieConfig();
    deleteCookie(c, c.env.SESSION_NAME, cookieConfig);
  }

  return c.json({ success: true });
});

// POST /v1/auth/forgot-password (public with rate limiting)
auth.post(
  "/forgot-password",
  unauthMiddleware,
  authRateLimit,
  zValidator("json", forgotPasswordSchema),
  async (c) => {
    const data = c.req.valid("json");
    const authService = new AuthService(c.env);

    await authService.forgotPassword(data);

    return c.json({ success: true });
  },
);

// POST /v1/auth/reset-password (public with rate limiting)
auth.post(
  "/reset-password",
  unauthMiddleware,
  authRateLimit,
  zValidator("json", resetPasswordSchema),
  async (c) => {
    const data = c.req.valid("json");
    const authService = new AuthService(c.env);
    const sessionService = new SessionService(c.env);

    const result = await authService.resetPassword(data);

    if (!result.success) {
      return c.json({ error: result.error }, result.status as any);
    }

    // Clear any existing session cookie for this client
    const cookieConfig = sessionService.getSessionCookieConfig();
    deleteCookie(c, c.env.SESSION_NAME, cookieConfig);

    return c.json({ success: true });
  },
);

export default auth;
