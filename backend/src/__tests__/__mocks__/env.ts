import { vi } from "vitest";
import { mockKV } from "./cache";

// Environment bindings mock
export const mockEnv = {
  DB: {} as any,
  CACHE: mockKV as any,
  JWT_SECRET: "test-secret",
  ENVIRONMENT: "test",
  SESSION_NAME: "taskative_session_test",
  AUTH_RATE_LIMITER: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  } as any,
};

// Request/Response mocks
export const mockRequest = {
  valid: vi.fn(),
  url: "http://localhost:3000/v1/auth/forgot-password",
};

export const mockResponse = {
  json: vi.fn().mockReturnThis(),
  status: vi.fn().mockReturnThis(),
  headers: new Map(),
};

export const mockContext = {
  req: mockRequest,
  env: mockEnv,
  get: vi.fn(),
  set: vi.fn(),
  json: vi.fn().mockReturnThis(),
  status: vi.fn().mockReturnThis(),
  headers: new Map(),
};

// Creator mock for DB
export const mockDateFreeze = 1000000000;
