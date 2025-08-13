import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth";
import { publicRoute } from "./middlewares/public";
import { AppEnv } from "./types";
import auth from "./routes/auth";

const app = new Hono<AppEnv>();

// Middlewares
app.use("*", cors());
app.use("*", authMiddleware);

// Health check endpoint (public route)
app.get("/", publicRoute, (c) => {
  return c.json({ status: "ok", message: "Taskative API v1" });
});

// Routes
app.route("/v1/auth", auth);

export default app;
