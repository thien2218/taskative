import { Hono } from "hono";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { AppEnv } from "@/types";
import {
  mockAuthService,
  mockSessionService,
  mockBcrypt,
  mockJWT,
  mockAuthRateLimit,
  mockAuthMiddleware,
  mockSetCookie,
  mockDeleteCookie,
  mockGetCookie,
} from "@/__tests__/mocks/auth";
import { mockCreateDatabase, mockEnv } from "@/__tests__/mocks/env";

// Mock external dependencies at the top level
vi.mock("@/services/auth", () => ({
  AuthService: vi.fn().mockImplementation(() => mockAuthService),
}));
vi.mock("@/services/session", () => ({
  SessionService: vi.fn().mockImplementation(() => mockSessionService),
}));
vi.mock("bcrypt", () => mockBcrypt);

vi.mock("jsonwebtoken", () => mockJWT);

vi.mock("@/middlewares", () => ({
  authRateLimit: mockAuthRateLimit,
  authMiddleware: mockAuthMiddleware,
}));
vi.mock("hono/cookie", () => ({
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie,
  getCookie: mockGetCookie,
}));
vi.mock("@/db", () => ({
  createDatabase: mockCreateDatabase,
}));

const requestBaseOpts = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

describe("POST /v1/auth/register", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it("should return 400 if the request is invalid", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    let response: Response;

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({}),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "invalid_email", password: "pass" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "test@example.com", password: "123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "test@example.com" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "test@example.com", password: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should return 201 if the user is created", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful registration
    mockAuthService.register.mockResolvedValue({
      success: true,
      sessionToken: "mock.jwt.token",
      status: 201,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "password123",
        }),
      },
      mockEnv,
    );

    expect(response.status).toBe(201);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "password123",
    });
  });

  it("should return 400 if the user already exists", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock registration failure for existing user
    mockAuthService.register.mockResolvedValue({
      success: false,
      error: "Registration failed",
      status: 400,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({
          email: "existing@example.com",
          password: "password123",
        }),
      },
      mockEnv,
    );

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Registration failed" });
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: "existing@example.com",
      password: "password123",
    });
  });

  it("should create a new session and get the session token", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful registration with session token
    const mockSessionToken = "new.session.token.123";
    mockAuthService.register.mockResolvedValue({
      success: true,
      sessionToken: mockSessionToken,
      status: 201,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({
          email: "sessiontest@example.com",
          password: "password123",
        }),
      },
      mockEnv,
    );

    expect(response.status).toBe(201);
    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: "sessiontest@example.com",
      password: "password123",
    });

    // Verify that SessionService was called to get cookie config
    expect(mockSessionService.getSessionCookieConfig).toHaveBeenCalled();
  });

  it("should set the session token in cookie with name 'taskative_session'", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful registration
    const mockSessionToken = "cookie.test.token.456";
    mockAuthService.register.mockResolvedValue({
      success: true,
      sessionToken: mockSessionToken,
      status: 201,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify({
          email: "cookietest@example.com",
          password: "password123",
        }),
      },
      mockEnv,
    );

    expect(response.status).toBe(201);

    // Verify that setCookie was called with correct parameters
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.any(Object), // context object
      "taskative_session", // cookie name
      mockSessionToken, // session token
      { httpOnly: true, secure: false, sameSite: "Strict", maxAge: 1500 },
    );
  });
});
