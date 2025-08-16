import { vi } from "vitest";

// AuthService mock
export const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
};

// SessionService mock
export const mockSessionService = {
  create: vi.fn(),
  findById: vi.fn(),
  revoke: vi.fn(),
  revokeAllUserSessions: vi.fn(),
  getSessionCookieConfig: vi.fn().mockReturnValue({
    name: "taskative_session",
    options: {
      httpOnly: true,
      secure: false,
      sameSite: "Strict" as const,
      maxAge: 1500, // 25 minutes + 5 minute buffer
    },
  }),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
};

// bcrypt mock
export const mockBcrypt = {
  hash: vi
    .fn()
    .mockImplementation((password, salt) => Promise.resolve(`hashed_${password}_${salt}`)),
  compare: vi
    .fn()
    .mockImplementation((password, hash) =>
      Promise.resolve(password === hash.replace("hashed_", "")),
    ),
};

// JWT mock
export const mockJWT = {
  sign: vi.fn().mockImplementation((payload, secret) => Promise.resolve("mock.jwt.token")),
  verify: vi.fn().mockImplementation((token, secret) =>
    Promise.resolve({
      sessionId: "mock-session-id",
      userId: "mock-user-id",
      email: "test@example.com",
    }),
  ),
};

// Middleware mocks
export const mockAuthRateLimit = vi.fn().mockImplementation((c, next) => next());
export const mockAuthMiddleware = vi.fn().mockImplementation((c, next) => {
  c.set("user", {
    userId: "mock-user-id",
    sessionId: "mock-session-id",
    email: "test@example.com",
  });
  return next();
});

// Hono cookie mocks
export const mockSetCookie = vi.fn();
export const mockDeleteCookie = vi.fn();
export const mockGetCookie = vi.fn();

// Test data mocks
export const mockUser = {
  id: "user123",
  email: "test@example.com",
  passwordHash: "hashed_password123",
  firstName: "Test",
  lastName: "User",
  username: "testuser",
  profileImageUrl: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

export const mockSession = {
  id: "session123",
  userId: "user123",
  status: "active",
  createdAt: "2025-01-01T00:00:00.000Z",
  expiresAt: "2025-01-01T01:00:00.000Z",
  revokedAt: null,
};

export const mockPasswordResetToken = {
  id: "token123",
  userId: "user123",
  token: "valid-reset-token-123",
  expiresAt: "2025-01-01T01:00:00.000Z",
  usedAt: null,
  createdAt: "2025-01-01T00:00:00.000Z",
};
