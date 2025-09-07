import { Hono } from "hono";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AppEnv } from "@/types";
import { mockCookie, mockSessionService, sessionOpts } from "./__mocks__/auth";
import { mockEnv } from "./__mocks__/env";

vi.mock("@/services/session", () => ({
  SessionService: vi.fn().mockImplementation(() => mockSessionService),
}));
vi.mock("hono/cookie", () => mockCookie);

// Polyfill atob for Node test environment
if (!(globalThis as any).atob) {
  (globalThis as any).atob = (input: string) => Buffer.from(input, "base64").toString("binary");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authRateLimit", () => {
  it("allows request for anonymous user when limiter succeeds and uses path key", async () => {
    const { authRateLimit } = await import("@/middlewares");
    const app = new Hono<AppEnv>();

    app.use("/rl/anon/*", authRateLimit);
    app.get("/rl/anon/ping", (c) => c.json({ ok: true }));

    mockEnv.AUTH_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

    const res = await app.request("/rl/anon/ping", {}, mockEnv);
    expect(res.status).toBe(200);
    expect(mockEnv.AUTH_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: "path:/rl/anon/ping" });
  });

  it("blocks request for authenticated user when limiter fails and uses user key", async () => {
    const { authRateLimit } = await import("@/middlewares");
    const app = new Hono<AppEnv>();

    app.use("/rl/user/*", async (c, next) => {
      c.set("user", { userId: "mock-user-id", email: "u@test.com", sessionId: "sess" });
      await next();
    });
    app.use("/rl/user/*", authRateLimit);
    app.get("/rl/user/ping", (c) => c.json({ ok: true }));

    mockEnv.AUTH_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: false });

    const res = await app.request("/rl/user/ping", {}, mockEnv);
    expect(res.status).toBe(429);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Too many requests" });
    expect(mockEnv.AUTH_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: "user:mock-user-id" });
  });
});

describe("unauthMiddleware", () => {
  it("allows request when no session cookie is present", async () => {
    const { unauthMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/unauth/*", unauthMiddleware);
    app.get("/unauth/ping", (c) => c.json({ ok: true }));

    mockCookie.getCookie.mockReturnValue(undefined);

    const res = await app.request("/unauth/ping", {}, mockEnv);
    expect(res.status).toBe(200);
    expect(mockCookie.getCookie).toHaveBeenCalledWith(expect.any(Object), mockEnv.SESSION_NAME);
  });

  it("returns 401 when a session cookie exists", async () => {
    const { unauthMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/unauth/*", unauthMiddleware);
    app.get("/unauth/ping", (c) => c.json({ ok: true }));

    mockCookie.getCookie.mockReturnValue("some.session.token");

    const res = await app.request("/unauth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });
});

describe("authMiddleware", () => {
  it("returns 401 when no session cookie is present", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    mockCookie.getCookie.mockReturnValue(undefined);

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
  });

  it("passes through when JWT is valid and sets user in context", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true, user: c.get("user") }));

    const token = "valid.jwt.token";
    mockCookie.getCookie.mockReturnValue(token);
    mockSessionService.verifyToken.mockResolvedValue({
      sessionId: "sess-1",
      userId: "user-1",
      email: "user1@test.com",
    });

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.user).toEqual({ sessionId: "sess-1", userId: "user-1", email: "user1@test.com" });
    expect(mockSessionService.verifyToken).toHaveBeenCalledWith(token);
    expect(mockCookie.setCookie).not.toHaveBeenCalled();
  });

  it("renews session when JWT invalid but session exists, sets cookie, and proceeds", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    // Generate a token with a base64 payload containing sessionId
    const payload = Buffer.from(JSON.stringify({ sessionId: "session-123" })).toString("base64");
    const token = `x.${payload}.y`;

    mockCookie.getCookie.mockReturnValue(token);
    mockSessionService.verifyToken.mockResolvedValue(null);
    mockSessionService.findById.mockResolvedValue({
      sessionId: "session-123",
      userId: "user-2",
      email: "user2@test.com",
    });
    mockSessionService.generateToken.mockResolvedValue("new.session.token");

    // getSessionCookieConfig already returns sessionOpts by default
    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(200);
    expect(mockSessionService.findById).toHaveBeenCalledWith("session-123");
    expect(mockCookie.setCookie).toHaveBeenCalledWith(
      expect.any(Object),
      mockEnv.SESSION_NAME,
      "new.session.token",
      sessionOpts,
    );
  });

  it("returns 401 when JWT invalid and token payload missing sessionId", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    // Token without payload part
    const token = "onlyonepart";
    mockCookie.getCookie.mockReturnValue(token);
    mockSessionService.verifyToken.mockResolvedValue(null);

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
  });

  it("returns 401 when session not found during renewal", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    const payload = Buffer.from(JSON.stringify({ sessionId: "missing-session" })).toString(
      "base64",
    );
    const token = `x.${payload}.y`;

    mockCookie.getCookie.mockReturnValue(token);
    mockSessionService.verifyToken.mockResolvedValue(null);
    mockSessionService.findById.mockResolvedValue(null);

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
  });

  it("returns 401 when renewal branch throws an error", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    const payload = Buffer.from(JSON.stringify({ sessionId: "session-err" })).toString("base64");
    const token = `x.${payload}.y`;

    mockCookie.getCookie.mockReturnValue(token);
    mockSessionService.verifyToken.mockResolvedValue(null);
    mockSessionService.findById.mockRejectedValue(new Error("db failure"));

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
  });
});
