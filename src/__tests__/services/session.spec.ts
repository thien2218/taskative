import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockEnv, mockDb, mockCreateDatabase, mockKV, mockDateFreeze } from "../__mocks__/env";
import { mockJWT } from "../__mocks__/auth";
import SessionService from "@/services/session";

vi.mock("@/db", () => ({
  createDatabase: mockCreateDatabase,
}));
vi.mock("hono/jwt", () => mockJWT);

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn().mockReturnValue("mock-uuid"),
  },
});

let sessionService: SessionService;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { default: SessionService } = await import("@/services/session");
  sessionService = new SessionService(mockEnv);
});

describe("SessionService constructor", () => {
  it("should create a database client instance", () => {
    expect(mockCreateDatabase).toHaveBeenCalledWith(mockEnv.DB);
    expect(sessionService).toHaveProperty("db");
    expect(sessionService).toHaveProperty("kv");
    expect(sessionService).toHaveProperty("jwtSecret", "test-secret");
    expect(sessionService).toHaveProperty("environment", "test");
  });
});

describe("SessionService.verifyToken", () => {
  it("should call the 'verify' helper function from hono/jwt", async () => {
    const token = "valid.jwt.token";
    await sessionService.verifyToken(token);
    expect(mockJWT.verify).toHaveBeenCalledWith(token, mockEnv.JWT_SECRET);
  });

  it("should return the verified token", async () => {
    const token = "valid.jwt.token";
    const mockPayload = {
      sessionId: "session-id",
      userId: "user-id",
      email: "test@example.com",
    };
    mockJWT.verify.mockResolvedValue(mockPayload);

    const result = await sessionService.verifyToken(token);

    expect(result).toEqual(mockPayload);
  });

  it("should return null if token is not verified", async () => {
    const token = "invalid.jwt.token";
    mockJWT.verify.mockRejectedValueOnce(new Error("Invalid token"));

    const result = await sessionService.verifyToken(token);

    expect(result).toBeNull();
  });
});

describe("SessionService.create", () => {
  it("should create a new session and store it in the database", async () => {
    const sessionData = {
      id: "mock-uuid",
      userId: "user-id",
      status: "active",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
      revokedAt: null,
    };
    mockDb.executeTakeFirst.mockResolvedValue(sessionData);

    await sessionService.create({ userId: "user-id", email: "test@example.com" });

    expect(mockDb.insertInto).toHaveBeenCalledWith("sessions");
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "mock-uuid",
        userId: "user-id",
      }),
    );
  });

  it("should forward provided device metadata to the insert values", async () => {
    const sessionData = {
      id: "mock-uuid",
      userId: "user-id",
      status: "active",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
      revokedAt: null,
      deviceId: "device-abc",
      deviceName: "Pixel 8",
      ipAddress: "203.0.113.5",
    } as any;
    mockDb.executeTakeFirst.mockResolvedValue(sessionData);

    await sessionService.create({
      userId: "user-id",
      email: "test@example.com",
      deviceId: "device-abc",
      deviceName: "Pixel 8",
      ipAddress: "203.0.113.5",
    });

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        deviceId: "device-abc",
        deviceName: "Pixel 8",
        ipAddress: "203.0.113.5",
      }),
    );
  });

  it("should cache the new session", async () => {
    const sessionData = {
      id: "mock-uuid",
      userId: "user-id",
      status: "active",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
      revokedAt: null,
    };
    mockDb.executeTakeFirst.mockResolvedValue(sessionData);

    await sessionService.create({ userId: "user-id", email: "test@example.com" });

    expect(mockKV.put).toHaveBeenCalled();
    expect(mockKV.put.mock.calls[0][0]).toBe("session:mock-uuid");
    expect(JSON.parse(mockKV.put.mock.calls[0][1])).toEqual(
      expect.objectContaining({
        userId: "user-id",
        email: "test@example.com",
        status: "active",
      }),
    );
  });

  it("should generate a JWT token with the new session ID", async () => {
    const sessionData = {
      id: "mock-uuid",
      userId: "user-id",
      status: "active",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
      revokedAt: null,
    };
    mockDb.executeTakeFirst.mockResolvedValue(sessionData);

    await sessionService.create({ userId: "user-id", email: "test@example.com" });

    expect(mockJWT.sign).toHaveBeenCalled();
    const payload = mockJWT.sign.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        sessionId: "mock-uuid",
        userId: "user-id",
        email: "test@example.com",
      }),
    );
  });

  it("should fail if either of the steps above fail", async () => {
    mockDb.executeTakeFirst.mockResolvedValue(null);

    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sessionService.create({ userId: "user-id", email: "test@example.com" });

    expect(result).toEqual({
      success: false,
      error: "Failed to create session",
    });
  });

  it("should succeed and return the token when the process completes", async () => {
    const sessionData = {
      id: "mock-uuid",
      userId: "user-id",
      status: "active",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
      revokedAt: null,
      deviceId: "device-abc",
      deviceName: "Pixel 8",
      ipAddress: "203.0.113.5",
    };
    mockDb.executeTakeFirst.mockResolvedValue(sessionData);
    mockJWT.sign.mockResolvedValue("mock-jwt-token");

    const result = await sessionService.create({ userId: "user-id", email: "test@example.com" });

    expect(result).toEqual({
      success: true,
      sessionToken: "mock-jwt-token",
    });
  });
});

describe("SessionService.findById", () => {
  it("should find the session in the cache with ID", async () => {
    const cachedSession = JSON.stringify({
      userId: "user-id",
      email: "test@example.com",
      status: "active",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      deviceId: "device-xyz",
      deviceName: "MacBook",
      ipAddress: null,
    });
    mockKV.get.mockResolvedValue(cachedSession);

    const result = await sessionService.findById("session-id");

    expect(mockKV.get).toHaveBeenCalledWith("session:session-id");
    expect(result).toEqual({
      sessionId: "session-id",
      userId: "user-id",
      email: "test@example.com",
      deviceId: "device-xyz",
      deviceName: "MacBook",
      ipAddress: null,
    });
    expect(mockDb.executeTakeFirst).not.toHaveBeenCalled(); // Shouldn't query DB
  });

  it("should find the session in the database with ID if not exist in the cache", async () => {
    mockKV.get.mockResolvedValue(null);
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "session-id",
      userId: "user-id",
      email: "test@example.com",
      status: "active",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      deviceId: "device-xyz",
      deviceName: "MacBook",
      ipAddress: null,
    });

    const result = await sessionService.findById("session-id");

    expect(mockKV.get).toHaveBeenCalledWith("session:session-id");
    expect(mockDb.selectFrom).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalledWith("sessions.id", "=", "session-id");
    expect(result).toEqual({
      sessionId: "session-id",
      userId: "user-id",
      email: "test@example.com",
      deviceId: "device-xyz",
      deviceName: "MacBook",
      ipAddress: null,
    });
  });

  it("should store the session back in the cache if it's found in the database and return it", async () => {
    mockKV.get.mockResolvedValue(null);
    mockDb.executeTakeFirst.mockResolvedValue({
      id: "session-id",
      userId: "user-id",
      email: "test@example.com",
      status: "active",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      deviceId: "device-xyz",
      deviceName: "MacBook",
      ipAddress: null,
    });

    await sessionService.findById("session-id");

    expect(mockKV.put).toHaveBeenCalled();
    expect(mockKV.put.mock.calls[0][0]).toBe("session:session-id");
    expect(JSON.parse(mockKV.put.mock.calls[0][1])).toEqual(
      expect.objectContaining({
        userId: "user-id",
        email: "test@example.com",
        status: "active",
      }),
    );
  });

  it("should return `null` if session is not found", async () => {
    mockKV.get.mockResolvedValue(null);
    mockDb.executeTakeFirst.mockResolvedValue(null);

    const result = await sessionService.findById("nonexistent-session-id");

    expect(result).toBeNull();
  });
});

describe("SessionService.revoke", () => {
  it("should revoke the session in the database", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ numUpdatedRows: 1 });

    await sessionService.revoke("session-id");

    expect(mockDb.updateTable).toHaveBeenCalledWith("sessions");
    expect(mockDb.set).toHaveBeenCalledWith({
      status: "revoked",
      revokedAt: expect.any(String),
    });
    expect(mockDb.where).toHaveBeenCalledWith("id", "=", "session-id");
    expect(mockDb.where).toHaveBeenCalledWith("status", "=", "active");
  });

  it("should revoke the session in the cache", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ numUpdatedRows: 1 });

    await sessionService.revoke("session-id");

    expect(mockKV.delete).toHaveBeenCalledWith("session:session-id");
  });

  it("should fail if the database or cache call fail", async () => {
    mockDb.executeTakeFirst.mockRejectedValueOnce(new Error("Database error"));

    const result = await sessionService.revoke("session-id");

    expect(result).toBe(false);
  });

  it("should return true when revocation succeeds", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ numUpdatedRows: 1 });

    const successResult = await sessionService.revoke("session-id");

    expect(successResult).toBe(true);
  });

  it("should return false when no rows are updated", async () => {
    mockDb.executeTakeFirst.mockResolvedValue({ numUpdatedRows: 0 });

    const failureResult = await sessionService.revoke("nonexistent-session-id");

    expect(failureResult).toBe(false);
  });
});

describe("SessionService.revokeAllUserSessions", () => {
  it("should find all active sessions of a user in the database", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    await sessionService.revokeAllUserSessions("user-id");

    expect(mockDb.selectFrom).toHaveBeenCalledWith("sessions");
    expect(mockDb.select).toHaveBeenCalledWith(["id"]);
    expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-id");
    expect(mockDb.where).toHaveBeenCalledWith("status", "=", "active");
  });

  it("should revoke all those active sessions in the database and cache", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    await sessionService.revokeAllUserSessions("user-id");

    expect(mockDb.updateTable).toHaveBeenCalledWith("sessions");
    expect(mockDb.set).toHaveBeenCalledWith({
      status: "revoked",
      revokedAt: expect.any(String),
    });
    expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-id");
    expect(mockDb.where).toHaveBeenCalledWith("status", "=", "active");

    expect(mockKV.delete).toHaveBeenCalledWith("session:session-1");
    expect(mockKV.delete).toHaveBeenCalledWith("session:session-2");
  });

  it("should return true when all sessions are cleared", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    const successResult = await sessionService.revokeAllUserSessions("user-id");

    expect(successResult).toBe(true);
  });

  it("should return false when database operation fails", async () => {
    mockDb.execute.mockRejectedValueOnce(new Error("Database error"));

    const failureResult = await sessionService.revokeAllUserSessions("user-id");

    expect(failureResult).toBe(false);
  });
});

describe("SessionService.revokeUserOtherSessions", () => {
  it("should find all active sessions of a user that is not the current session in the database", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    await sessionService.revokeUserOtherSessions("user-id", "current-session-id");

    expect(mockDb.selectFrom).toHaveBeenCalledWith("sessions");
    expect(mockDb.select).toHaveBeenCalledWith(["id"]);
    expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-id");
    expect(mockDb.where).toHaveBeenCalledWith("status", "=", "active");
    expect(mockDb.where).toHaveBeenCalledWith("id", "!=", "current-session-id");
  });

  it("should revoke all those found sessions in the database and cache", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    await sessionService.revokeUserOtherSessions("user-id", "current-session-id");

    expect(mockDb.updateTable).toHaveBeenCalledWith("sessions");
    expect(mockDb.set).toHaveBeenCalledWith({
      status: "revoked",
      revokedAt: expect.any(String),
    });
    expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-id");
    expect(mockDb.where).toHaveBeenCalledWith("status", "=", "active");
    expect(mockDb.where).toHaveBeenCalledWith("id", "!=", "current-session-id");

    expect(mockKV.delete).toHaveBeenCalledWith("session:session-1");
    expect(mockKV.delete).toHaveBeenCalledWith("session:session-2");
  });

  it("should return true when all other sessions are cleared", async () => {
    mockDb.execute.mockResolvedValue([{ id: "session-1" }, { id: "session-2" }]);

    const successResult = await sessionService.revokeUserOtherSessions(
      "user-id",
      "current-session-id",
    );

    expect(successResult).toBe(true);
  });

  it("should return false when database operation fails", async () => {
    mockDb.execute.mockRejectedValueOnce(new Error("Database error"));

    const failureResult = await sessionService.revokeUserOtherSessions(
      "user-id",
      "current-session-id",
    );

    expect(failureResult).toBe(false);
  });
});

describe("SessionService.getSessionCookieConfig", () => {
  it("should return the cookie config with these props: httpOnly, secure, sameSite, maxAge", () => {
    const prodEnv = {
      ...mockEnv,
      ENVIRONMENT: "production",
    };
    const prodService = new SessionService(prodEnv);
    const prodConfig = prodService.getSessionCookieConfig();

    expect(prodConfig).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: expect.any(Number),
    });

    const testService = new SessionService(mockEnv);
    const testConfig = testService.getSessionCookieConfig();

    expect(testConfig).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: expect.any(Number),
    });
  });
});

describe("SessionService.generateToken", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(mockDateFreeze * 1000);
  });

  it("should call the 'sign' helper from hono/jwt", async () => {
    await sessionService.generateToken({
      sessionId: "session-id",
      userId: "user-id",
      email: "test@example.com",
    });

    expect(mockJWT.sign).toHaveBeenCalled();
  });

  it("should sign with JWT secret and a payload with shape: sessionId, userId, email, iat, exp", async () => {
    await sessionService.generateToken({
      sessionId: "session-id",
      userId: "user-id",
      email: "test@example.com",
    });

    expect(mockJWT.sign).toHaveBeenCalledWith(
      {
        sessionId: "session-id",
        userId: "user-id",
        email: "test@example.com",
        iat: mockDateFreeze,
        exp: mockDateFreeze + 30 * 60,
      },
      mockEnv.JWT_SECRET,
    );
  });
});
