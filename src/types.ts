import type { JwtVariables } from "hono/jwt";

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    // Auth configuration environment variables
    JWT_EXPIRES_IN?: string;
    REFRESH_TOKEN_EXPIRES_IN?: string;
  };
  Variables: JwtVariables & {
    isPublic?: boolean;
  };
}
