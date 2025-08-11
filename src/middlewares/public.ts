import { createMiddleware } from "hono/factory";
import { AppEnv } from "../types";

// Middleware to mark routes as public (no authentication required)
export const publicRoute = createMiddleware<AppEnv>(async (c, next) => {
  // Mark this request as public by setting a flag in the context
  c.set("isPublic", true);
  await next();
});

// Helper function to check if a route is public
export const isPublicRoute = (c: any): boolean => {
  return c.get("isPublic") === true;
};
