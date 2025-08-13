export interface UserContext {
  userId: string;
  email: string;
  sessionId: string;
}

export interface Bindings {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  NODE_ENV?: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    user?: UserContext;
    isPublic?: boolean;
  };
}
