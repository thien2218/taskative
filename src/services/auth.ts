import bcrypt from "bcryptjs";
import { createDatabase } from "../db";
import { signJWT, signRefreshToken } from "../utils/jwt";
import type { AppEnv } from "../types";
import { LoginRequest, RegisterRequest } from "../validators/auth";

export interface AuthResult {
  success: true;
  token: string;
  refreshToken: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    data: RegisterRequest,
    env: AppEnv["Bindings"],
  ): Promise<AuthResult | AuthError> {
    const db = createDatabase(env);
    const { email, password } = data;

    // Check if user already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      return {
        success: false,
        error: "Registration failed",
        status: 400,
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 11);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Create user
    await db
      .insertInto("users")
      .values({
        id: userId,
        email,
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .execute();

    // Generate tokens
    const token = await signJWT({ userId, email, tokenVersion: 0 }, env.JWT_SECRET, env);
    const refreshToken = await signRefreshToken(
      { userId, tokenVersion: 0, type: "refresh" },
      env.JWT_SECRET,
      env,
    );

    return { success: true, token, refreshToken };
  }

  /**
   * Login an existing user
   */
  static async login(data: LoginRequest, env: AppEnv["Bindings"]): Promise<AuthResult | AuthError> {
    const db = createDatabase(env);
    const { email, password } = data;

    // Find user
    const user = await db
      .selectFrom("users")
      .select(["id", "email", "passwordHash", "tokenVersion"])
      .where("email", "=", email)
      .executeTakeFirst();

    if (!user) {
      return {
        success: false,
        error: "Authentication failed",
        status: 401,
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Authentication failed",
        status: 401,
      };
    }

    // Generate tokens
    const token = await signJWT(
      { userId: user.id, email: user.email, tokenVersion: user.tokenVersion },
      env.JWT_SECRET,
      env,
    );
    const refreshToken = await signRefreshToken(
      { userId: user.id, tokenVersion: user.tokenVersion, type: "refresh" },
      env.JWT_SECRET,
      env,
    );

    return { success: true, token, refreshToken };
  }
}
