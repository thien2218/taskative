import bcrypt from "bcryptjs";
import { createDatabase } from "../db";
import { SessionService } from "./session";
import { getAuthConfig } from "../config/auth";
import type { AppEnv } from "../types";
import { LoginRequest, RegisterRequest } from "../validators/auth";

export interface AuthResult {
  success: true;
  sessionToken: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export class AuthService {
  private readonly env: AppEnv["Bindings"];
  private readonly db: ReturnType<typeof createDatabase>;
  private readonly sessions: SessionService;

  constructor(env: AppEnv["Bindings"]) {
    this.env = env;
    this.db = createDatabase(env.DB);
    this.sessions = new SessionService(env);
  }
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResult | AuthError> {
    const { email, password } = data;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 11);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Optimistic insert with conflict handling - eliminates race condition
    const insertedUser = await this.db
      .insertInto("users")
      .values({
        id: userId,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflict((oc) => oc.column("email").doNothing())
      .returning(["id", "email"])
      .executeTakeFirst();

    // If no user returned, email already exists
    if (!insertedUser) {
      return {
        success: false,
        error: "Registration failed",
        status: 400,
      };
    }

    // Create session with 7-day expiration
    const config = getAuthConfig(this.env);
    const sessionExpiresAt = new Date(Date.now() + config.SESSION_DB_EXPIRES_IN * 1000);

    const sessionResult = await this.sessions.create({
      userId: insertedUser.id,
      email: insertedUser.email,
      expiresAt: sessionExpiresAt,
    });

    if (!sessionResult.success) {
      return {
        success: false,
        error: "Failed to create session",
        status: 500,
      };
    }

    // Generate session JWT token
    const sessionToken = await this.sessions.generateToken({
      sessionId: sessionResult.session.id,
      userId: insertedUser.id,
      email: insertedUser.email,
    });

    return { success: true, sessionToken };
  }

  /**
   * Login an existing user
   */
  async login(data: LoginRequest): Promise<AuthResult | AuthError> {
    const { email, password } = data;

    // Find user
    const user = await this.db
      .selectFrom("users")
      .select(["id", "email", "passwordHash"])
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

    // Create session with 7-day expiration
    const config = getAuthConfig(this.env);
    const sessionExpiresAt = new Date(Date.now() + config.SESSION_DB_EXPIRES_IN * 1000);

    const sessionResult = await this.sessions.create({
      userId: user.id,
      email: user.email,
      expiresAt: sessionExpiresAt,
    });

    if (!sessionResult.success) {
      return {
        success: false,
        error: "Failed to create session",
        status: 500,
      };
    }

    // Generate session JWT token
    const sessionToken = await this.sessions.generateToken({
      sessionId: sessionResult.session.id,
      userId: user.id,
      email: user.email,
    });

    return { success: true, sessionToken };
  }

  /**
   * Logout user - revoke session
   */
  async logout(sessionId: string): Promise<boolean> {
    return this.sessions.revoke(sessionId);
  }
}
