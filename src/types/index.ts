export interface UserContext {
  userId: string;
  email: string;
  sessionId: string;
}

type RateLimiter = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

export interface Bindings {
  DB: D1Database;
  CACHE: KVNamespace;
  AUTH_RATE_LIMITER: RateLimiter;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    user?: UserContext;
    isPublic?: boolean;
  };
}
