import { LoginSchema, SelectUserSchema, SignupSchema } from "../schemas";
import { InferInput, InferOutput } from "valibot";

/**
 * User types
 */
export type SelectUserDto = InferInput<typeof SelectUserSchema>;

export type UserDto = {
   userId: string;
   email: string;
   firstName: string;
   lastName: string;
   profileImage: string | null;
};

/**
 * Auth types
 */
export type LoginDto = InferInput<typeof LoginSchema>;

export type SignupDto = InferOutput<typeof SignupSchema>;

export type AuthTokensDto = {
   accessToken: string;
   refreshToken: string;
};

export type JwtPayload = {
   sub: string;
   exp: number;
   email: string;
   firstName: string;
   lastName: string;
   profileImage?: string | null;
};
