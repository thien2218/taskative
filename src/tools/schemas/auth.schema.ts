import {
   email,
   maxLength,
   minLength,
   object,
   string,
   Input,
   nullable,
   optional,
   Output
} from "valibot";

/**
 * Schemas
 */
export const SignupSchema = object({
   email: string([email()]),
   password: string([minLength(8), maxLength(32)]),
   confirmPassword: string([minLength(8), maxLength(32)]),
   username: string([minLength(3), maxLength(24)]),
   profileImage: optional(nullable(string()), null)
});

export const LoginSchema = object({
   email: string([email()]),
   password: string([minLength(8), maxLength(32)])
});

/**
 * Types
 */
export type SignupDto = Output<typeof SignupSchema>;
export type LoginDto = Input<typeof LoginSchema>;
