import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth";
import { mockEnv, mockDb, mockCreateDatabase } from "../__mocks__/env";
import { mockBcrypt, mockSessionService } from "../__mocks__/auth";
import { SessionService } from "@/services/session";
import { createDatabase } from "@/db";

vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
}));
vi.mock("@/services/session", () => ({
  SessionService: vi.fn().mockImplementation(() => mockSessionService),
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

describe("AuthService constructor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a database client instance and get session service", () => {
    const authService = new AuthService(mockEnv);

    expect(createDatabase).toHaveBeenCalledWith(mockEnv.DB);
    expect(SessionService).toHaveBeenCalledWith(mockEnv);
  });
});

describe("AuthService.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should hash the password", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValueOnce({
      success: true,
      sessionToken: "session-token",
    });

    await authService.register({ email: "test@example.com", password: "password123" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 11);
  });

  it("should fail if the user already exists", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce(null);

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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValueOnce({
      success: true,
      sessionToken: "session-token",
    });

    await authService.register({ email: "test@example.com", password: "password123" });

    expect(mockDb.insertInto).toHaveBeenCalledWith("users");
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mock-uuid",
        email: "test@example.com",
        passwordHash: "hashed_password_11",
      }),
    );
  });

  it("should fail if the session is not successfully created", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValueOnce({
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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockSessionService.create.mockResolvedValueOnce({
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch user from database using email", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockSessionService.create.mockResolvedValueOnce({
      success: true,
      sessionToken: "session-token",
    });

    await authService.login({ email: "test@example.com", password: "password123" });

    expect(mockDb.selectFrom).toHaveBeenCalledWith("users");
    expect(mockDb.where).toHaveBeenCalledWith("email", "=", "test@example.com");
  });

  it("should fail and return a generic message if user doesn't exist", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce(null);

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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockSessionService.create.mockResolvedValueOnce({
      success: true,
      sessionToken: "session-token",
    });

    await authService.login({ email: "test@example.com", password: "password123" });

    expect(mockBcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
  });

  it("should fail and return a generic message password is incorrect", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValueOnce(false);

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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValueOnce(true);
    mockSessionService.create.mockResolvedValueOnce({
      success: false,
      error: "Session creation failed",
    });

    const result = await authService.login({ email: "test@example.com", password: "password123" });

    expect(result).toEqual({
      success: false,
      error: "Failed to create session",
      status: 500,
    });
  });

  it("should create a new session and return the session ID on successful login", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed_password",
    });
    mockBcrypt.compare.mockResolvedValueOnce(true);
    mockSessionService.create.mockResolvedValueOnce({
      success: true,
      sessionToken: "session-token",
    });

    const result = await authService.login({ email: "test@example.com", password: "password123" });

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
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to prevent test output pollution
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should check in the database if the user exists", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValueOnce(undefined);

    await authService.forgotPassword({ email: "test@example.com" });

    expect(mockDb.selectFrom).toHaveBeenCalledWith("users");
    expect(mockDb.where).toHaveBeenCalledWith("email", "=", "test@example.com");
  });

  it("should succeed even when user is not found", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce(null);

    const result = await authService.forgotPassword({ email: "nonexistent@example.com" });

    expect(result).toEqual({ success: true });
  });

  it("should generate a random short-lived token and store it in the database", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValueOnce(undefined);

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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({ id: "user-id", email: "test@example.com" });
    mockDb.execute.mockResolvedValueOnce(undefined);

    const result = await authService.forgotPassword({ email: "test@example.com" });

    expect(result).toEqual({ success: true });
  });
});

describe("AuthService.resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get the reset token from the database", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
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
    const authService = new AuthService(mockEnv);

    mockDb.executeTakeFirst.mockResolvedValueOnce(null);

    let result = await authService.resetPassword({
      token: "invalid-token",
      newPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 400,
    });

    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: new Date().toISOString(),
    });

    result = await authService.resetPassword({ token: "used-token", newPassword: "new-password" });

    expect(result).toEqual({
      success: false,
      error: "Password reset failed",
      status: 400,
    });

    mockDb.executeTakeFirst.mockResolvedValueOnce({
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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      id: "token-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null,
    });

    await authService.resetPassword({ token: "valid-token", newPassword: "new-password" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("new-password", 11);
  });

  it("should store the new password and mark the token as used via transaction", async () => {
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
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
    const authService = new AuthService(mockEnv);
    mockDb.executeTakeFirst.mockResolvedValueOnce({
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
