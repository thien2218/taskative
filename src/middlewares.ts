import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv, AuthEnv } from "@/types";
import { SessionService } from "@/services/session";

// authRateLimit
export async function authRateLimit(c: Context<AppEnv>, next: Next) {
  const url = new URL(c.req.url);
  const user = c.get("user");
  const limiterKey = user?.userId ? `user:${user.userId}` : `path:${url.pathname}`;

  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: limiterKey });
  if (!success) {
    return c.json({ error: "Too many requests" }, 429);
  }
  return next();
}

// authMiddleware
export async function authMiddleware(c: Context<AppEnv & AuthEnv>, next: Next) {
  const isPublic = c.get("isPublic");
  if (isPublic) next();

  const sessions = new SessionService(c.env);
  const sessionToken = getCookie(c, "taskative_session");

  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jwtPayload = await sessions.verifyToken(sessionToken);
  if (jwtPayload) {
    c.set("user", {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      sessionId: jwtPayload.sessionId,
    });
    return next();
  }

  try {
    const base64Payload = sessionToken.split(".")[1];
    if (!base64Payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const decodedPayload = JSON.parse(atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!decodedPayload.sessionId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const sessionPayload = await sessions.findById(decodedPayload.sessionId);
    if (!sessionPayload) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const newSessionToken = await sessions.generateToken(sessionPayload);
    const cookieConfig = sessions.getSessionCookieConfig();
    setCookie(c, cookieConfig.name, newSessionToken, cookieConfig.options);
    c.set("user", {
      userId: sessionPayload.userId,
      email: sessionPayload.email,
      sessionId: sessionPayload.sessionId,
    });
    return next();
  } catch (error) {
    console.error("Auth middleware renewal error:", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
}
