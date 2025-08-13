export interface UserContext {
  userId: string;
  email: string;
  sessionId: string;
}

export interface AppEnv {
  Bindings: {
    DB: D1Database;
    SESSION_KV: KVNamespace;
    JWT_SECRET: string;
    // Environment detection
    ENVIRONMENT: string;
  };
  Variables: {
    user?: UserContext;
    isPublic?: boolean;
  };
}
