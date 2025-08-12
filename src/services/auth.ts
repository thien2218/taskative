import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "../config/auth";

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
