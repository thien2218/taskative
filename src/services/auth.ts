import bcrypt from "bcryptjs";
import { createDatabase } from "../db";
import { SessionService } from "./session";
import type { Bindings } from "../types";
import type { AuthResult, AuthError } from "../types/auth";
import { LoginRequest, RegisterRequest } from "../validators/auth";

export class AuthService {
  private readonly db: ReturnType<typeof createDatabase>;
  private readonly sessions: SessionService;

  constructor(env: Bindings) {
    this.db = createDatabase(env.DB);
    this.sessions = new SessionService(env);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResult | AuthError> {
    const { email, password } = data;

    const passwordHash = await bcrypt.hash(password, 11);
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

    const sessionResult = await this.sessions.create({
      userId: insertedUser.id,
      email: insertedUser.email,
    });

    if (!sessionResult.success) {
      return {
        success: false,
        error: "Failed to create session",
        status: 500,
      };
    }

    return { success: true, sessionToken: sessionResult.sessionToken };
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

    const sessionResult = await this.sessions.create({
      userId: user.id,
      email: user.email,
    });

    if (!sessionResult.success) {
      return {
        success: false,
        error: "Failed to create session",
        status: 500,
      };
    }

    return { success: true, sessionToken: sessionResult.sessionToken };
  }

  /**
   * Logout user - revoke session
   */
  async logout(sessionId: string): Promise<boolean> {
    return this.sessions.revoke(sessionId);
  }
}
