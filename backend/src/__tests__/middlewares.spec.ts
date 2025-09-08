import { Hono } from "hono";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AppEnv } from "@/types";
import { mockCookie } from "./__mocks__/auth";
import { mockSessionService } from "./__mocks__/session";
import { mockEnv } from "./__mocks__/env";
import { sessionTestOpts } from "./data/auth";
import { initContainerMiddleware } from "@/middlewares";

vi.mock("@/services/session", () => ({
  default: vi.fn().mockImplementation(() => mockSessionService),
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
    app.use(initContainerMiddleware);
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
    app.use(initContainerMiddleware);
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
    app.use(initContainerMiddleware);
    app.use("/auth/*", authMiddleware);
    app.get("/auth/ping", (c) => c.json({ ok: true }));

    mockCookie.getCookie.mockReturnValue(undefined);

    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(401);
  });

  it("passes through when JWT is valid and sets user in context", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use(initContainerMiddleware);
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
    app.use(initContainerMiddleware);
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

    // getSessionCookieConfig already returns sessionTestOpts by default
    const res = await app.request("/auth/ping", {}, mockEnv);
    expect(res.status).toBe(200);
    expect(mockSessionService.findById).toHaveBeenCalledWith("session-123");
    expect(mockCookie.setCookie).toHaveBeenCalledWith(
      expect.any(Object),
      mockEnv.SESSION_NAME,
      "new.session.token",
      sessionTestOpts,
    );
  });

  it("returns 401 when JWT invalid and token payload missing sessionId", async () => {
    const { authMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use(initContainerMiddleware);
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
    app.use(initContainerMiddleware);
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
    app.use(initContainerMiddleware);
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

describe("initContainerMiddleware", () => {
  it("sets container on context using createContainer(env)", async () => {
    vi.resetModules();
    const fakeContainer = { get: vi.fn() } as any;
    const createContainerMock = vi.fn().mockReturnValue(fakeContainer);
    vi.doMock("@/di", () => ({ createContainer: createContainerMock }));

    const { initContainerMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use(initContainerMiddleware);
    app.get("/di/check", (c) => {
      const container = c.get("container");
      return c.json({ ok: !!container, same: container === fakeContainer });
    });

    const res = await app.request("/di/check", {}, mockEnv);
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(createContainerMock).toHaveBeenCalledWith(mockEnv);
    expect(body).toEqual({ ok: true, same: true });
  });

  it("creates a new container for each request", async () => {
    vi.resetModules();
    const c0 = { get: vi.fn() } as any;
    const c1 = { get: vi.fn() } as any;
    const createContainerMock = vi
      .fn()
      .mockReturnValueOnce(c0)
      .mockReturnValueOnce(c1);
    vi.doMock("@/di", () => ({ createContainer: createContainerMock }));

    const { initContainerMiddleware } = await import("@/middlewares");
    const app = new Hono<AppEnv>();
    app.use(initContainerMiddleware);
    app.get("/di/id", (c) => {
      const container = c.get("container");
      const id = container === c0 ? "c0" : container === c1 ? "c1" : "other";
      return c.json({ id });
    });

    let res = await app.request("/di/id", {}, mockEnv);
    let body = (await res.json()) as any;
    expect(body.id).toBe("c0");

    res = await app.request("/di/id", {}, mockEnv);
    body = (await res.json()) as any;
    expect(body.id).toBe("c1");

    expect(createContainerMock).toHaveBeenCalledTimes(2);
  });
});
