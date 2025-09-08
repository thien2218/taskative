import { vi } from "vitest";
import { sessionTestOpts } from "../data/auth";

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
  getSessionCookieConfig: vi.fn().mockReturnValue(sessionTestOpts),
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
