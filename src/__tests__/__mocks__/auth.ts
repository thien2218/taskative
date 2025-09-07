import { vi } from "vitest";

// Valid payloads
export const sessionOpts = {
  httpOnly: true,
  secure: false,
  sameSite: "Strict" as const,
  maxAge: 1800, // 20 minutes + 10 minute buffer
};

export const authPayload = {
  // Used for log in and registering
  email: "john.doe@taskative.com",
  password: "SecurePassword123!",
};

export const resetPayload = {
  // Used for forgot password and resetting
  forgotPassword: {
    email: "user@taskative.com",
  },
  resetPassword: {
    token: "valid-reset-token-abc123",
    newPassword: "NewSecurePassword789!",
  },
};

export const requestBaseOpts = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

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
  revokeUserOtherSessions: vi.fn(),
  revokeSessionsByIds: vi.fn(),
  getSessionCookieConfig: vi.fn().mockReturnValue(sessionOpts),
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
export const mockUnauthMiddleware = vi.fn().mockImplementation((c, next) => next());
export const mockAuthMiddleware = vi.fn().mockImplementation((c, next) => {
  c.set("user", {
    userId: "mock-user-id",
    sessionId: "mock-session-id",
    email: "test@example.com",
  });
  return next();
});

// Hono cookie mocks
export const mockCookie = {
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
};

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
