import { vi } from "vitest";
import { sessionTestOpts } from "../data/auth";

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
