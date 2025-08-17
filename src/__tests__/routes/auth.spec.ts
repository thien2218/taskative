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
  sessionOpts,
  authPayload,
  requestBaseOpts,
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
        body: JSON.stringify(authPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Registration failed" });
    expect(mockAuthService.register).toHaveBeenCalledWith(authPayload);
  });

  it("should return 201 if new user is created, create a new session, get the session token and set the session token in cookie with name 'taskative_session'", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful registration
    const mockSessionToken = "new.user.session.token.123";
    mockAuthService.register.mockResolvedValue({
      success: true,
      sessionToken: mockSessionToken,
      status: 201,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseOpts,
        body: JSON.stringify(authPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(201);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });

    // Verify AuthService.register was called correctly
    expect(mockAuthService.register).toHaveBeenCalledWith(authPayload);

    // Verify SessionService.getSessionCookieConfig was called
    expect(mockSessionService.getSessionCookieConfig).toHaveBeenCalled();

    // Verify setCookie was called with correct parameters
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.any(Object), // context object
      "taskative_session_test", // cookie name
      mockSessionToken, // session token
      sessionOpts,
    );
  });
});

describe("POST /v1/auth/login", () => {
  it("should return status 400 for all invalid login payload", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    let response: Response;

    // Empty payload
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({}),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Invalid email format
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "invalid_email", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing password
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "test@example.com" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing email
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty password
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "test@example.com", password: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty email
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({ email: "", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should fetch the user's hashed password with email when the payload is valid", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful login
    mockAuthService.login.mockResolvedValue({
      success: true,
      sessionToken: "login.session.token",
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify(authPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    expect(mockAuthService.login).toHaveBeenCalledWith(authPayload);
  });

  it("should return status 401 for invalid login with either email or password with a generic message for security", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock login failure (user not found or invalid password)
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: "Authentication failed",
      status: 401,
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        }),
      },
      mockEnv,
    );

    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Authentication failed" });
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });
  });

  it("should return status 200 for valid login, create a new session, get the new session token and set it in the cookie", async () => {
    const { default: authRoutes } = await import("@/routes/auth");

    const app = new Hono<AppEnv>();
    app.route("/v1/auth", authRoutes);

    // Mock successful login
    const mockLoginSessionToken = "valid.login.session.token.456";
    mockAuthService.login.mockResolvedValue({
      success: true,
      sessionToken: mockLoginSessionToken,
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseOpts,
        body: JSON.stringify(authPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });

    // Verify AuthService.login was called correctly
    expect(mockAuthService.login).toHaveBeenCalledWith(authPayload);

    // Verify SessionService.getSessionCookieConfig was called
    expect(mockSessionService.getSessionCookieConfig).toHaveBeenCalled();

    // Verify setCookie was called with correct parameters
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.any(Object), // context object
      "taskative_session_test", // cookie name
      mockLoginSessionToken, // session token
      sessionOpts,
    );
  });
});
