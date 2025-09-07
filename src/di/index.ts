import type { Bindings } from "@/types";
import { ServiceContainer } from "@/di/container";
import DatabaseService from "@/services/database";
import CacheService from "@/services/cache";
import SessionService from "@/services/session";
import AuthService from "@/services/auth";

export function createContainer(env: Bindings): ServiceContainer {
  const container = new ServiceContainer(env);

  // Infrastructure services
  container.register("database", () => new DatabaseService(env.DB));
  container.register("cache", () => new CacheService(env.CACHE));

  // Business services
  container.register(
    "session",
    (c) =>
      new SessionService({
        dbService: c.get("database"),
        cache: c.get("cache"),
        config: env,
      }),
  );

  container.register(
    "auth",
    (c) =>
      new AuthService({
        dbService: c.get("database"),
        session: c.get("session"),
        config: env,
      }),
  );

  return container;
}

export type { ServiceContainer } from "@/di/container";
