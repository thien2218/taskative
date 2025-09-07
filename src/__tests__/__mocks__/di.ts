import { vi } from "vitest";

export const mockCreateContainer = vi.fn().mockReturnValue({
  get: vi.fn(),
});
