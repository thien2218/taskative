import type { JwtVariables } from "hono/jwt";

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
  };
  Variables: JwtVariables & {
    isPublic?: boolean;
  };
}
