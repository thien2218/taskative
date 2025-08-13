import type { JwtVariables } from "hono/jwt";

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    // Environment detection
    ENVIRONMENT?: string;
    NODE_ENV?: string;
  };
  Variables: JwtVariables & {
    isPublic?: boolean;
  };
}
