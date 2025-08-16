import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppEnv } from "@/types";
import auth from "@/routes/auth";
import { csrf } from "hono/csrf";
import { cache } from "hono/cache";

const app = new Hono<AppEnv>();

// Middlewares
app.use(csrf());
app.use(cors());
app.get("*", cache({ cacheName: "taskative-cache", cacheControl: "max-age=3600" }));

// Health check endpoint (public route)
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Taskative API v1" });
});

// Routes
app.route("/v1/auth", auth);

export default app;
