import { vi } from "vitest";

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
