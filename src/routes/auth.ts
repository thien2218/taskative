import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie } from "hono/cookie";
import { createDatabase } from "../db";
import { AuthService } from "../services/auth";
import { signJWT, generateRefreshToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

// POST /v1/auth/register
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = createDatabase(c.env);

  try {
    // Check if user already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      return c.json({ error: "Registration failed" }, 400);
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Create user
    await db
      .insertInto("users")
      .values({
        id: userId,
        email,
        passwordHash,
        tokenVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute();

    // Generate JWT
    const token = await signJWT({ userId, email, tokenVersion: 0 }, c.env.JWT_SECRET);

    // Generate and set refresh token cookie
    const refreshToken = generateRefreshToken();
    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return c.json(
      {
        success: true,
        user: { id: userId, email },
        token,
      },
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// POST /v1/auth/login
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = createDatabase(c.env);

  try {
    // Find user
    const user = await db
      .selectFrom("users")
      .select(["id", "email", "passwordHash", "tokenVersion"])
      .where("email", "=", email)
      .executeTakeFirst();

    if (!user) {
      return c.json({ error: "Authentication failed" }, 401);
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return c.json({ error: "Authentication failed" }, 401);
    }

    // Generate JWT
    const token = await signJWT(
      { userId: user.id, email: user.email, tokenVersion: user.tokenVersion },
      c.env.JWT_SECRET,
    );

    // Generate and set refresh token cookie
    const refreshToken = generateRefreshToken();
    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return c.json({
      success: true,
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

export default auth;
