import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwtMiddleware } from "./middlewares/jwt";
import { publicRoute } from "./middlewares/public";
import { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Middlewares
app.use("*", cors());
app.use("*", jwtMiddleware);

// Health check endpoint (public route)
app.get("/", publicRoute, (c) => {
  return c.json({ status: "ok", message: "Taskative API v1" });
});

export default app;
