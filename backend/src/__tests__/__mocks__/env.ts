import { vi } from "vitest";
import { mockKV } from "./cache";
import { mockBcrypt } from "./auth";

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
  AUTH_SERVICE: {
    fetch: vi.fn(async (req: Request) => {
      const url = new URL(req.url);
      const body = await req.json();
      if (url.pathname === "/hash") {
        const hash = await mockBcrypt.hash(body.password, body.cost ?? 11);
        return new Response(JSON.stringify({ hash }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.pathname === "/verify") {
        const valid = await mockBcrypt.compare(body.password, body.hash);
        return new Response(JSON.stringify({ valid }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not found", { status: 404 });
    }),
  },
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
