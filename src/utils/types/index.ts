import {
   CreateTaskSchema,
   LoginSchema,
   SelectTaskSchema,
   SelectUserSchema,
   SignupSchema,
   UpdateTaskSchema
} from "../schemas";
import { InferInput, InferOutput } from "valibot";

/**
 * Query types
 */
export type PaginationQuery = {
   limit: number;
   offset: number;
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
 * Task types
 */
export type CreateTaskDto = InferInput<typeof CreateTaskSchema>;
export type SelectTaskDto = InferInput<typeof SelectTaskSchema>;
export type UpdateTaskDto = InferInput<typeof UpdateTaskSchema>;
