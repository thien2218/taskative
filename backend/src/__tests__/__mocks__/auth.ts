import { vi } from "vitest";

// AuthService mock
export const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
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
  sign: vi.fn().mockResolvedValue("mock.jwt.token"),
  verify: vi.fn().mockResolvedValue({
    sessionId: "mock-session-id",
    userId: "mock-user-id",
    email: "test@example.com",
  }),
};

// Hono cookie mocks
export const mockCookie = {
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
};
