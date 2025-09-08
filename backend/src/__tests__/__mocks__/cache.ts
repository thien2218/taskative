import { vi } from "vitest";

export const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

export const mockCacheService = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  mdelete: vi.fn(),
  key: vi.fn(),
};
