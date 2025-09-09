import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const logoutSchema = z
  .object({
    mode: z.enum(["current", "others", "all", "byIds"]).optional().default("current"),
    sessionIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // sessionIds is required when mode is "byIds"
      if (data.mode === "byIds") {
        return data.sessionIds && data.sessionIds.length > 0;
      }
      return true;
    },
    {
      message: "sessionIds is required and must not be empty when mode is 'byIds'",
      path: ["sessionIds"],
    },
  );

export const hashSchema = z.object({
  password: z.string().min(1),
  cost: z.number().int().min(6).max(14).optional().default(11),
});

export const verifySchema = z.object({
  password: z.string().min(1),
  hash: z.string().min(1),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;
