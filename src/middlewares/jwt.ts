import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import { AppEnv } from "../types";

// Simplified JWT middleware using built-in Hono JWT
export const jwtMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // Check if this route is marked as public
  const isPublic = c.get("isPublic") === true;

  // Allow public routes to pass through without authentication
  if (isPublic) {
    return next();
  }

  // For protected routes, use the built-in JWT middleware
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  });

  return jwtMiddleware(c, next);
});
