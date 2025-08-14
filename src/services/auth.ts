import bcrypt from "bcryptjs";
import { createDatabase } from "../db";
import { SessionService } from "./session";
import type { Bindings } from "../types";
import type { AuthResult, AuthError, PasswordResetResult, PasswordResetError } from "../types/auth";
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../validators/auth";

export class AuthService {
  private readonly db: ReturnType<typeof createDatabase>;
  private readonly sessions: SessionService;
  private readonly TOKEN_EXPIRY_MINUTES = 60; // 1 hour expiry for reset tokens

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

  /**
   * Generate a password reset token for a user
   * Returns generic success regardless of whether email exists for security
   */
  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<PasswordResetResult | PasswordResetError> {
    const { email } = data;

    try {
      // Check if user exists
      const user = await this.db
        .selectFrom("users")
        .select(["id", "email"])
        .where("email", "=", email)
        .executeTakeFirst();

      // If no user found, still return success (security: don't leak account existence)
      if (!user) {
        console.log(`No user found with email ${email}, but returning success for security`);
        return { success: true };
      }

      // Generate a secure random token
      const tokenBuffer = new Uint8Array(32);
      crypto.getRandomValues(tokenBuffer);
      const token = [...tokenBuffer].map((b) => b.toString(16).padStart(2, "0")).join("");

      // Set expiration time (1 hour)
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Store token in database
      await this.db
        .insertInto("passwordResetTokens")
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          token: token,
          expiresAt: expiresAt.toISOString(),
        })
        .execute();

      // For MVP, log the token (would be emailed in production)
      console.log(`PASSWORD RESET TOKEN for ${email}: ${token}`);
      console.log(`Valid until: ${expiresAt.toISOString()}`);

      return { success: true };
    } catch (error) {
      console.error("Error generating password reset token:", error);
      return {
        success: false,
        error: "Failed to process request",
        status: 500,
      };
    }
  }

  /**
   * Reset a user's password with a valid token
   */
  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<PasswordResetResult | PasswordResetError> {
    const { token, newPassword } = data;

    try {
      // Find token with constant-time comparison
      const resetToken = await this.db
        .selectFrom("passwordResetTokens")
        .select(["id", "userId", "expiresAt", "usedAt"])
        .where("token", "=", token)
        .executeTakeFirst();

      // If token not found or already used or expired, return generic error
      if (!resetToken) {
        return {
          success: false,
          error: "Password reset failed",
          status: 400,
        };
      }

      if (resetToken.usedAt) {
        return {
          success: false,
          error: "Password reset failed",
          status: 400,
        };
      }

      // Check token expiration
      const now = new Date();
      if (new Date(resetToken.expiresAt) < now) {
        return {
          success: false,
          error: "Password reset failed",
          status: 400,
        };
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 11);

      // Update password in a transaction
      await this.db.transaction().execute(async (trx) => {
        // 1. Mark token as used
        await trx
          .updateTable("passwordResetTokens")
          .set({ usedAt: now.toISOString() })
          .where("id", "=", resetToken.id)
          .execute();

        // 2. Update user's password
        await trx
          .updateTable("users")
          .set({
            passwordHash: passwordHash,
            updatedAt: now.toISOString(),
          })
          .where("id", "=", resetToken.userId)
          .execute();
      });

      // Revoke all sessions for the user
      await this.sessions.revokeAllUserSessions(resetToken.userId);

      return { success: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        error: "Password reset failed",
        status: 500,
      };
    }
  }
}
