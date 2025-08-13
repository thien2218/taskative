import bcrypt from "bcryptjs";
import { createDatabase } from "../db";
import { generateTokenPair } from "../utils/jwt";
import type { AppEnv } from "../types";
import { LoginRequest, RegisterRequest } from "../validators/auth";

export interface AuthResult {
  success: true;
  accessToken: string;
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 11);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Optimistic insert with conflict handling - eliminates race condition
    const insertedUser = await db
      .insertInto("users")
      .values({
        id: userId,
        email,
        passwordHash,
        tokenVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflict((oc) => oc.column("email").doNothing())
      .returning(["id", "email", "tokenVersion"])
      .executeTakeFirst();

    // If no user returned, email already exists
    if (!insertedUser) {
      return {
        success: false,
        error: "Registration failed",
        status: 400,
      };
    }

    // Generate both tokens with consistent timestamps
    const payload = {
      userId: insertedUser.id,
      email: insertedUser.email,
      tokenVersion: insertedUser.tokenVersion,
    };

    const tokens = await generateTokenPair(payload, env);

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
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

    // Generate both tokens with consistent timestamps
    const payload = {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    const tokens = await generateTokenPair(payload, env);

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
