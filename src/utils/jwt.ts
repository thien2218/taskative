import { sign } from "hono/jwt";

export interface JWTPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
  );
}

export function generateRefreshToken(): string {
  return crypto.randomUUID();
}
