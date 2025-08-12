import { describe, it, expect, vi } from "vitest";
import { AuthService } from "../services/auth";
import { signJWT } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth";

describe("Auth Components", () => {
  describe("AuthService", () => {
    it("should hash passwords correctly", async () => {
      const password = "testpassword123";
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify passwords correctly", async () => {
      const password = "testpassword123";
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.verifyPassword("wrongpassword", hash);
      expect(isInvalid).toBe(false);
    });

    it("should never store plain text passwords", async () => {
      const password = "secretpassword123";
      const hash = await AuthService.hashPassword(password);

      expect(hash).not.toContain(password);
      expect(hash.length).toBeGreaterThan(password.length);
    });
  });

  describe("JWT Utils", () => {
    it("should sign JWT tokens with correct payload", async () => {
      const payload = {
        userId: "test-user-123",
        email: "test@example.com",
        tokenVersion: 0,
      };
      const secret = "test-secret";

      const token = await signJWT(payload, secret);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });
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

  describe("Security Requirements", () => {
    it("should never log plain text passwords", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const consoleErrorSpy = vi.spyOn(console, "error");

      const password = "secretpassword123";
      await AuthService.hashPassword(password);

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

    it("should use bcrypt for password hashing", async () => {
      const password = "testpassword123";
      const hash = await AuthService.hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
      expect(hash).toMatch(/^\$2[abyxy]\$/);

      // Should contain salt rounds (typically 10)
      expect(hash).toMatch(/^\$2[abyxy]\$\d+\$/);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await AuthService.verifyPassword(password, hash1)).toBe(true);
      expect(await AuthService.verifyPassword(password, hash2)).toBe(true);
    });
  });
});
