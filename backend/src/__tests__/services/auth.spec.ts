import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockEnv, mockDb, mockCreateDatabase } from "../__mocks__/env";
import { mockBcrypt, mockSessionService } from "../__mocks__/auth";
import AuthService from "@/services/auth";

vi.mock("bcryptjs", () => ({ default: mockBcrypt }));
vi.mock("@/services/session", () => ({
  default: vi.fn().mockImplementation(() => mockSessionService),
}));
vi.mock("@/db", () => ({
  createDatabase: mockCreateDatabase,
}));

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn().mockReturnValue("mock-uuid"),
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
      }
      return arr;
    }),
  },
});

let authService: AuthService;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { default: AuthService } = await import("@/services/auth");
  authService = new AuthService(mockEnv);
});

describe("AuthService constructor", () => {
  it("should create a database client instance and get session service", async () => {
    const { default: SessionService } = await import("@/services/session");

    expect(mockCreateDatabase).toHaveBeenCalledWith(mockEnv.DB);
    expect(SessionService).toHaveBeenCalledWith(mockEnv);
    expect(authService).toBeInstanceOf(AuthService);
    expect(authService).toHaveProperty("register");
    expect(authService).toHaveProperty("login");
    expect(authService).toHaveProperty("forgotPassword");
    expect(authService).toHaveProperty("resetPassword");
  });
});

describe("AuthService.register", () => {
  it("should hash the password", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    await authService.register({ email: "test@example.com", password: "password123" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 11);
  });

  it("should fail if the user already exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(null);

    const result = await authService.register({
      email: "existing@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "Registration failed",
      status: 400,
    });
  });

  it("should create a new user in the database", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    await authService.register({ email: "test@example.com", password: "password123" });

    expect(mockDb.insertInto).toHaveBeenCalledWith("users");
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mock-uuid",
        email: "test@example.com",
        passwordHash: "hashed_password123_11",
      }),
    );
  });

  it("should fail if the session is not successfully created", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValue({
      success: false,
      error: "Session creation failed",
    });

    const result = await authService.register({
      email: "test@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to create session",
      status: 500,
    });
  });

  it("should create a new session and return the session ID on successful registration", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    const result = await authService.register({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockSessionService.create).toHaveBeenCalledWith({
      userId: "user-id",
      email: "test@example.com",
    });
    expect(result).toEqual({
      success: true,
      sessionToken: "session-token",
    });
  });
});

describe("AuthService.login", () => {
  it("should fetch user from database using email", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    await authService.login({ email: "test@example.com", password: "password123" });

    expect(mockDb.selectFrom).toHaveBeenCalledWith("users");
    expect(mockDb.where).toHaveBeenCalledWith("email", "=", "test@example.com");
  });

  it("should fail and return a generic message if user doesn't exist", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(null);

    const result = await authService.login({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "Authentication failed",
      status: 401,
    });
  });

  it("should validate password against the hashed one fetched from database", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    await authService.login({ email: "test@example.com", password: "password123" });

    expect(mockBcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
  });

  it("should fail and return a generic message password is incorrect", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValue(false);

    const result = await authService.login({
      email: "test@example.com",
      password: "wrong_password",
    });

    expect(result).toEqual({
      success: false,
      error: "Authentication failed",
      status: 401,
    });
  });

  it("should fail if the session is not successfully created", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockSessionService.create.mockResolvedValue({
      success: false,
      error: "Failed to create session",
    });

    const result = await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to create session",
      status: 500,
    });
  });

  it("should create a new session and return the session ID on successful login", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockSessionService.create.mockResolvedValue({
      success: true,
      sessionToken: "session-token",
    });

    const result = await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockSessionService.create).toHaveBeenCalledWith({
      userId: "user-id",
      email: "test@example.com",
    });
    expect(result).toEqual({
      success: true,
      sessionToken: "session-token",
    });
  });
});

describe("AuthService.forgotPassword", () => {
  it("should check in the database if the user exists", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValue(undefined);

    await authService.forgotPassword({ email: "test@example.com" });

    expect(mockDb.selectFrom).toHaveBeenCalledWith("users");
    expect(mockDb.where).toHaveBeenCalledWith("email", "=", "test@example.com");
  });

  it("should succeed even when user is not found", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(null);

    const result = await authService.forgotPassword({ email: "nonexistent@example.com" });

    expect(result).toEqual({ success: true });
  });

  it("should generate a random short-lived token and store it in the database", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValue(undefined);

    await authService.forgotPassword({ email: "test@example.com" });

    expect(crypto.getRandomValues).toHaveBeenCalled();
    expect(mockDb.insertInto).toHaveBeenCalledWith("passwordResetTokens");
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mock-uuid",
        userId: "user-id",
        token: expect.any(String),
        expiresAt: expect.any(String),
      }),
    );
  });

  it("should succeed after the token is stored", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValue(undefined);

    const result = await authService.forgotPassword({ email: "test@example.com" });

    expect(result).toEqual({ success: true });
  });
});

describe("AuthService.resetPassword", () => {
  it("should get the reset token from the database", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    await authService.resetPassword({ token: "valid-token", newPassword: "new-password" });

    expect(mockDb.selectFrom).toHaveBeenCalledWith("passwordResetTokens");
    expect(mockDb.where).toHaveBeenCalledWith("token", "=", "valid-token");
  });

  it("should fail with generic message when token is not found, used or expired", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(null);

    let result = await authService.resetPassword({
      token: "invalid-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 400,
    });

    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: new Date().toISOString(),
    });

    result = await authService.resetPassword({
      token: "used-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 400,
    });

    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
      usedAt: null,
    });

    result = await authService.resetPassword({
      token: "expired-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 400,
    });
  });

  it("should hash the new password", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    await authService.resetPassword({ token: "valid-token", newPassword: "new-password" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("new-password", 11);
  });

  it("should store the new password and mark the token as used via transaction", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    await authService.resetPassword({ token: "valid-token", newPassword: "new-password" });

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockDb.transaction().execute).toHaveBeenCalled();
  });

  it("should fail if the database call(s) fail", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    const originalTransaction = mockDb.transaction;
    mockDb.transaction = vi.fn().mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("Database error")),
    });

    const result = await authService.resetPassword({
      token: "valid-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 500,
    });

    mockDb.transaction = originalTransaction;
  });

  it("should succeed when the process completes", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    const result = await authService.resetPassword({
      token: "valid-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({ success: true });
    expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith("user-id");
  });
});
