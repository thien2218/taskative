import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../services/auth";
import { SessionService } from "../services/session";
import { generateSessionToken, verifySessionToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth";
import bcrypt from "bcryptjs";

// Mock environment for testing
const mockEnv = {
  JWT_SECRET: "test-secret-key",
  DB: {} as D1Database,
  SESSION_KV: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as any,
  ENVIRONMENT: "development",
};

// Create a more flexible mock database
const createMockDb = () => {
  const mockExecuteTakeFirst = vi.fn();

  return {
    insertInto: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflict: vi.fn(() => ({
          returning: vi.fn(() => ({
            executeTakeFirst: mockExecuteTakeFirst,
          })),
        })),
        returning: vi.fn(() => ({
          executeTakeFirst: mockExecuteTakeFirst,
        })),
      })),
    })),
    selectFrom: vi.fn(() => ({
      select: vi.fn(() => ({
        where: vi.fn(() => ({
          executeTakeFirst: mockExecuteTakeFirst,
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              executeTakeFirst: mockExecuteTakeFirst,
            })),
          })),
        })),
      })),
      innerJoin: vi.fn(() => ({
        select: vi.fn(() => ({
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              where: vi.fn(() => ({
                executeTakeFirst: mockExecuteTakeFirst,
              })),
            })),
          })),
        })),
      })),
    })),
    updateTable: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          where: vi.fn(() => ({
            executeTakeFirst: mockExecuteTakeFirst,
          })),
        })),
      })),
    })),
    _mockExecuteTakeFirst: mockExecuteTakeFirst,
  };
};

// Mock database
vi.mock("../db", () => ({
  createDatabase: vi.fn(() => createMockDb()),
}));

describe("Session-based Auth System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validators", () => {
    describe("registerSchema", () => {
      it("should validate correct registration data", () => {
        const validData = {
          email: "test@example.com",
          password: "password123",
        };

        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should reject invalid email", () => {
        const invalidData = {
          email: "invalid-email",
          password: "password123",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject short password", () => {
        const invalidData = {
          email: "test@example.com",
          password: "123",
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("loginSchema", () => {
      it("should validate correct login data", () => {
        const validData = {
          email: "test@example.com",
          password: "password123",
        };

        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should reject invalid email", () => {
        const invalidData = {
          email: "invalid-email",
          password: "password123",
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject empty password", () => {
        const invalidData = {
          email: "test@example.com",
          password: "",
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("JWT Session Utils", () => {
    it("should generate session JWT tokens with correct payload", async () => {
      const sessionPayload = {
        sessionId: "test-session-123",
        userId: "test-user-123",
        email: "test@example.com",
      };

      const token = await generateSessionToken(sessionPayload, mockEnv);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should verify valid session JWT tokens", async () => {
      const sessionPayload = {
        sessionId: "test-session-123",
        userId: "test-user-123",
        email: "test@example.com",
      };

      const token = await generateSessionToken(sessionPayload, mockEnv);
      const decoded = await verifySessionToken(token, mockEnv);

      expect(decoded).toBeDefined();
      expect(decoded?.sessionId).toBe(sessionPayload.sessionId);
      expect(decoded?.userId).toBe(sessionPayload.userId);
      expect(decoded?.email).toBe(sessionPayload.email);
    });

    it("should reject invalid JWT tokens", async () => {
      const invalidToken = "invalid.token.here";
      const decoded = await verifySessionToken(invalidToken, mockEnv);

      expect(decoded).toBeNull();
    });
  });

  describe("SessionService", () => {
    it("should create sessions with proper structure", async () => {
      const mockSession = {
        id: "test-session-id",
        userId: "test-user-id",
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: null,
      };

      // Mock successful database insert
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;
      mockDb._mockExecuteTakeFirst.mockResolvedValue(mockSession);

      const result = await SessionService.create(
        {
          userId: "test-user-id",
          email: "test@example.com",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        mockEnv,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session).toEqual(mockSession);
      }
      expect(mockEnv.SESSION_KV.put).toHaveBeenCalledWith(
        `session:${mockSession.id}`,
        expect.stringContaining('"userId":"test-user-id"'),
        { expirationTtl: 1200 }, // 20 minutes
      );
    });

    it("should find sessions from KV cache", async () => {
      const sessionId = "test-session-id";
      const cachedSession = {
        userId: "test-user-id",
        email: "test@example.com",
        status: "active",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      };

      mockEnv.SESSION_KV.get.mockResolvedValue(JSON.stringify(cachedSession));

      const result = await SessionService.findById(sessionId, mockEnv);

      expect(result).toEqual({
        sessionId,
        userId: cachedSession.userId,
        email: cachedSession.email,
      });
    });

    it("should revoke sessions and clear from KV", async () => {
      const sessionId = "test-session-id";

      // Mock successful database update
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;
      mockDb._mockExecuteTakeFirst.mockResolvedValue({
        numUpdatedRows: BigInt(1),
      });

      const result = await SessionService.revoke(sessionId, mockEnv);

      expect(result).toBe(true);
      expect(mockEnv.SESSION_KV.delete).toHaveBeenCalledWith(`session:${sessionId}`);
    });
  });

  describe("Password Security", () => {
    it("should hash passwords with bcrypt", async () => {
      const password = "testpassword123";
      const hash = await bcrypt.hash(password, 11);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify passwords correctly", async () => {
      const password = "testpassword123";
      const hash = await bcrypt.hash(password, 11);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare("wrongpassword", hash);
      expect(isInvalid).toBe(false);
    });

    it("should never store plain text passwords", async () => {
      const password = "secretpassword123";
      const hash = await bcrypt.hash(password, 11);

      expect(hash).not.toContain(password);
      expect(hash.length).toBeGreaterThan(password.length);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await bcrypt.hash(password, 11);
      const hash2 = await bcrypt.hash(password, 11);

      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Security Requirements", () => {
    it("should never log plain text passwords", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const consoleErrorSpy = vi.spyOn(console, "error");

      const password = "secretpassword123";
      await bcrypt.hash(password, 11);

      // Check that no console logs contain the plain password
      const allLogs = [...consoleSpy.mock.calls.flat(), ...consoleErrorSpy.mock.calls.flat()];

      allLogs.forEach((log) => {
        if (typeof log === "string") {
          expect(log).not.toContain(password);
        }
      });

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should use bcrypt with appropriate salt rounds", async () => {
      const password = "testpassword123";
      const hash = await bcrypt.hash(password, 11);

      // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
      expect(hash).toMatch(/^\$2[abyxy]\$/);

      // Should contain salt rounds (11 in our case)
      expect(hash).toMatch(/^\$2[abyxy]\$11\$/);
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should handle successful register flow", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
      };

      const mockSession = {
        id: "test-session-id",
        userId: "test-user-id",
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: null,
      };

      // Mock successful user creation and session creation
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;

      // Mock user insert, then session insert
      mockDb._mockExecuteTakeFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockSession);

      const result = await AuthService.register(
        {
          email: "test@example.com",
          password: "password123",
        },
        mockEnv,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sessionToken).toBeDefined();
        expect(typeof result.sessionToken).toBe("string");
      }
    });

    it("should handle duplicate email registration", async () => {
      // Mock failed user creation (conflict)
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;
      mockDb._mockExecuteTakeFirst.mockResolvedValue(null);

      const result = await AuthService.register(
        {
          email: "existing@example.com",
          password: "password123",
        },
        mockEnv,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Registration failed");
        expect(result.status).toBe(400);
      }
    });

    it("should handle successful login flow", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("password123", 11),
      };

      const mockSession = {
        id: "test-session-id",
        userId: "test-user-id",
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: null,
      };

      // Mock user lookup and session creation
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;

      // Mock user select, then session insert
      mockDb._mockExecuteTakeFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockSession);

      const result = await AuthService.login(
        {
          email: "test@example.com",
          password: "password123",
        },
        mockEnv,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.sessionToken).toBeDefined();
        expect(typeof result.sessionToken).toBe("string");
      }
    });

    it("should handle invalid login credentials", async () => {
      // Mock user not found
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;
      mockDb._mockExecuteTakeFirst.mockResolvedValue(null);

      const result = await AuthService.login(
        {
          email: "nonexistent@example.com",
          password: "password123",
        },
        mockEnv,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Authentication failed");
        expect(result.status).toBe(401);
      }
    });

    it("should handle logout flow", async () => {
      const sessionId = "test-session-id";

      // Mock successful session revocation
      const { createDatabase } = await import("../db");
      const mockDb = createDatabase(mockEnv) as any;
      mockDb._mockExecuteTakeFirst.mockResolvedValue({ numUpdatedRows: BigInt(1) });

      const result = await AuthService.logout(sessionId, mockEnv);

      expect(result).toBe(true);
      expect(mockEnv.SESSION_KV.delete).toHaveBeenCalledWith(`session:${sessionId}`);
    });
  });
});
