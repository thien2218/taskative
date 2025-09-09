import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { hashSchema, verifySchema } from "@/validators/auth";

const app = new Hono();

app.post("/hash", zValidator("json", hashSchema), async (c) => {
  const { password, cost } = c.req.valid("json");
  const hash = await bcrypt.hash(password, cost);
  return c.json({ hash });
});

app.post("/verify", zValidator("json", verifySchema), async (c) => {
  const { password, hash } = c.req.valid("json");
  const valid = await bcrypt.compare(password, hash);
  return c.json({ valid });
});

export default app;
