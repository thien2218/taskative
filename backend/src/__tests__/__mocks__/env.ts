import { vi } from "vitest";

// Database mocks
export const mockDb = {
  selectFrom: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  execute: vi.fn(),
  executeTakeFirst: vi.fn(),
  insertInto: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  updateTable: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  onConflict: vi.fn().mockReturnThis(),
  doNothing: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  transaction: vi.fn().mockReturnValue({
    execute: vi.fn().mockImplementation(async (callback) => {
      const trx = {
        updateTable: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn(),
      };
      await callback(trx);
    }),
  }),
};

// KV cache mocks
export const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

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
export const mockCreateDatabase = vi.fn().mockReturnValue(mockDb);
export const mockDateFreeze = 1000000000;
