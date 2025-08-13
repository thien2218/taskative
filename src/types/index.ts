export interface UserContext {
  userId: string;
  email: string;
  sessionId: string;
}

export interface Bindings {
  DB: D1Database;
  CACHE: KVNamespace;
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
