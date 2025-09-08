import { Hono } from "hono";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { AppEnv } from "@/types";
import { mockAuthService, mockCookie } from "../__mocks__/auth";
import { mockSessionService } from "../__mocks__/session";
import { mockEnv } from "../__mocks__/env";
import { mockDbService } from "../__mocks__/database";
import { mockCacheService } from "../__mocks__/cache";
import { authTestPayload, requestBaseTestOpts, resetTestPayload, sessionTestOpts } from "../data/auth";
import { initContainerMiddleware } from "@/middlewares";

vi.mock("@/services/auth", () => ({
  default: vi.fn().mockImplementation(() => mockAuthService),
}));
vi.mock("@/services/session", () => ({
  default: vi.fn().mockImplementation(() => mockSessionService),
}));
vi.mock("@/services/database", () => ({ default: mockDbService }));
vi.mock("@/services/cache", () => ({ default: vi.fn().mockReturnValue(mockCacheService) }));
vi.mock("hono/cookie", () => mockCookie);

let authRoutes: Hono<AppEnv>;
let app: Hono<AppEnv>;

beforeEach(async () => {
  vi.clearAllMocks();
  authRoutes = (await import("@/routes/auth")).default;
  app = new Hono<AppEnv>();
  app.use(initContainerMiddleware);
  app.route("/v1/auth", authRoutes);
});

describe("POST /v1/auth/register", () => {
  it("should return 400 if the request is invalid", async () => {
    let response: Response;

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({}),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "invalid_email", password: "pass" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "test@example.com", password: "123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "test@example.com" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "test@example.com", password: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should return 400 if the user already exists", async () => {
    // Mock registration failure for existing user
    mockAuthService.register.mockResolvedValue({
      success: false,
      error: "Registration failed",
      status: 400,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(authTestPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Registration failed" });
    expect(mockAuthService.register).toHaveBeenCalledWith(authTestPayload);
  });

  it("should return 201 if new user is created, create a new session, get the session token and set the session token in cookie with name 'taskative_session'", async () => {
    // Mock successful registration
    const testSessionToken = "new.user.session.token.123";
    mockAuthService.register.mockResolvedValue({
      success: true,
      sessionToken: testSessionToken,
      status: 201,
    });

    const response = await app.request(
      "/v1/auth/register",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(authTestPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(201);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });

    // Verify AuthService.register was called correctly
    expect(mockAuthService.register).toHaveBeenCalledWith(authTestPayload);

    // Verify SessionService.getSessionCookieConfig was called
    expect(mockSessionService.getSessionCookieConfig).toHaveBeenCalled();

    // Verify setCookie was called with correct parameters
    expect(mockCookie.setCookie).toHaveBeenCalledWith(
      expect.any(Object), // context object
      "taskative_session_test", // cookie name
      testSessionToken, // session token
      sessionTestOpts,
    );
  });
});

describe("POST /v1/auth/login", () => {
  it("should return status 400 for all invalid login payload", async () => {
    let response: Response;

    // Empty payload
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({}),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Invalid email format
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "invalid_email", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing password
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "test@example.com" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing email
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty password
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "test@example.com", password: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty email
    response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "", password: "password123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should fetch the user's hashed password with email when the payload is valid", async () => {
    // Mock successful login
    mockAuthService.login.mockResolvedValue({
      success: true,
      sessionToken: "login.session.token",
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(authTestPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    expect(mockAuthService.login).toHaveBeenCalledWith(authTestPayload);
  });

  it("should return status 401 for invalid login with either email or password with a generic message for security", async () => {
    // Mock login failure (user not found or invalid password)
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: "Authentication failed",
      status: 401,
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
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
    // Mock successful login
    const mockLoginSessionToken = "valid.login.session.token.456";
    mockAuthService.login.mockResolvedValue({
      success: true,
      sessionToken: mockLoginSessionToken,
    });

    const response = await app.request(
      "/v1/auth/login",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(authTestPayload),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true });

    // Verify AuthService.login was called correctly
    expect(mockAuthService.login).toHaveBeenCalledWith(authTestPayload);

    // Verify SessionService.getSessionCookieConfig was called
    expect(mockSessionService.getSessionCookieConfig).toHaveBeenCalled();

    // Verify setCookie was called with correct parameters
    expect(mockCookie.setCookie).toHaveBeenCalledWith(
      expect.any(Object), // context object
      "taskative_session_test", // cookie name
      mockLoginSessionToken, // session token
      sessionTestOpts,
    );
  });
});

describe("POST /v1/auth/logout", () => {
  beforeEach(() => {
    // Satisfy authMiddleware: provide a valid session cookie and JWT verification
    mockCookie.getCookie.mockReturnValue("valid.jwt.token");
    mockSessionService.verifyToken.mockResolvedValue({
      sessionId: "mock-session-id",
      userId: "mock-user-id",
      email: "user@test.com",
    });
  });
  describe("mode: current (default)", () => {
    it("should revoke current session and delete cookie when no mode specified", async () => {
      mockSessionService.revoke.mockResolvedValue(true);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({}),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revoke).toHaveBeenCalledWith("mock-session-id");
      expect(mockCookie.deleteCookie).toHaveBeenCalledWith(
        expect.any(Object),
        "taskative_session_test",
        expect.anything(),
      );
    });

    it("should revoke current session and delete cookie when mode is explicitly 'current'", async () => {
      mockSessionService.revoke.mockResolvedValue(true);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "current" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revoke).toHaveBeenCalledWith("mock-session-id");
      expect(mockCookie.deleteCookie).toHaveBeenCalledWith(
        expect.any(Object),
        "taskative_session_test",
        expect.anything(),
      );
    });

    it("should return 500 when current session revocation fails", async () => {
      mockSessionService.revoke.mockResolvedValue(false);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({}),
        },
        mockEnv,
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Logout failed" });
    });
  });

  describe("mode: others", () => {
    it("should revoke other sessions and NOT delete cookie", async () => {
      mockSessionService.revokeUserOtherSessions.mockResolvedValue(true);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "others" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revokeUserOtherSessions).toHaveBeenCalledWith(
        "mock-user-id",
        "mock-session-id",
      );
      expect(mockCookie.deleteCookie).not.toHaveBeenCalled();
    });

    it("should return 500 when others session revocation fails", async () => {
      mockSessionService.revokeUserOtherSessions.mockResolvedValue(false);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "others" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Logout failed" });
    });
  });

  describe("mode: all", () => {
    it("should revoke all sessions and delete cookie", async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue(true);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "all" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith("mock-user-id");
      expect(mockCookie.deleteCookie).toHaveBeenCalledWith(
        expect.any(Object),
        "taskative_session_test",
        expect.anything(),
      );
    });

    it("should return 500 when all session revocation fails", async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue(false);

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "all" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Logout failed" });
    });
  });

  describe("mode: byIds", () => {
    it("should revoke specified sessions and NOT delete cookie when current not included", async () => {
      const sessionIds = ["session-1", "session-2"];
      mockSessionService.revokeSessionsByIds.mockResolvedValue({
        success: true,
        revokedCurrentSession: false,
      });

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "byIds", sessionIds }),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revokeSessionsByIds).toHaveBeenCalledWith(
        "mock-user-id",
        sessionIds,
      );
      expect(mockCookie.deleteCookie).not.toHaveBeenCalled();
    });

    it("should revoke specified sessions and delete cookie when current is included", async () => {
      const sessionIds = ["mock-session-id", "session-2"];
      mockSessionService.revokeSessionsByIds.mockResolvedValue({
        success: true,
        revokedCurrentSession: true,
      });

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "byIds", sessionIds }),
        },
        mockEnv,
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(mockSessionService.revokeSessionsByIds).toHaveBeenCalledWith(
        "mock-user-id",
        sessionIds,
      );
      expect(mockCookie.deleteCookie).toHaveBeenCalledWith(
        expect.any(Object),
        "taskative_session_test",
        expect.anything(),
      );
    });

    it("should return 500 when byIds session revocation fails", async () => {
      const sessionIds = ["session-1", "session-2"];
      mockSessionService.revokeSessionsByIds.mockResolvedValue({ success: false });

      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "byIds", sessionIds }),
        },
        mockEnv,
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Logout failed" });
    });
  });

  describe("validation errors", () => {
    it("should return 400 for invalid mode values", async () => {
      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "invalid" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 for byIds mode without sessionIds", async () => {
      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "byIds" }),
        },
        mockEnv,
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 for byIds mode with empty sessionIds array", async () => {
      const response = await app.request(
        "/v1/auth/logout",
        {
          ...requestBaseTestOpts,
          body: JSON.stringify({ mode: "byIds", sessionIds: [] }),
        },
        mockEnv,
      );

      expect(response.status).toBe(400);
    });
  });
});

describe("POST /v1/auth/forgot-password", () => {
  beforeEach(() => {
    // unauth route: no session cookie
    mockCookie.getCookie.mockReturnValue(undefined);
  });
  it("should return status 400 for invalid payloads", async () => {
    let response: Response;

    // Empty payload
    response = await app.request(
      "/v1/auth/forgot-password",
      { ...requestBaseTestOpts, body: JSON.stringify({}) },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Invalid email format
    response = await app.request(
      "/v1/auth/forgot-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "invalid_email" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing email
    response = await app.request(
      "/v1/auth/forgot-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ notEmail: "x" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty email
    response = await app.request(
      "/v1/auth/forgot-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ email: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should return 200 and trigger forgotPassword when payload is valid", async () => {
    mockAuthService.forgotPassword.mockResolvedValue({ success: true });

    const response = await app.request(
      "/v1/auth/forgot-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(resetTestPayload.forgotPassword),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(resetTestPayload.forgotPassword);
  });
});

describe("POST /v1/auth/reset-password", () => {
  beforeEach(() => {
    // unauth route: no session cookie
    mockCookie.getCookie.mockReturnValue(undefined);
  });
  it("should return status 400 for invalid payloads", async () => {
    let response: Response;

    // Empty payload
    response = await app.request(
      "/v1/auth/reset-password",
      { ...requestBaseTestOpts, body: JSON.stringify({}) },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing token
    response = await app.request(
      "/v1/auth/reset-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ newPassword: "Password!123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Missing newPassword
    response = await app.request(
      "/v1/auth/reset-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ token: "token-123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty token
    response = await app.request(
      "/v1/auth/reset-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ token: "", newPassword: "Password!123" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);

    // Empty newPassword
    response = await app.request(
      "/v1/auth/reset-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify({ token: "token-123", newPassword: "" }),
      },
      mockEnv,
    );
    expect(response.status).toBe(400);
  });

  it("should return 200 and reset password when payload is valid", async () => {
    mockAuthService.resetPassword.mockResolvedValue({ success: true });

    const response = await app.request(
      "/v1/auth/reset-password",
      {
        ...requestBaseTestOpts,
        body: JSON.stringify(resetTestPayload.resetPassword),
      },
      mockEnv,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetTestPayload.resetPassword);
  });
});
