import {
   AddToListSchema,
   CreateListSchema,
   CreateTaskSchema,
   LoginSchema,
   SelectListSchema,
   SelectTaskSchema,
   SelectUserSchema,
   SignupSchema,
   UpdateTaskSchema,
   UpdateUserSchema
} from "../schemas";
import { InferOutput } from "valibot";

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
export type LoginDto = InferOutput<typeof LoginSchema>;

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
export type SelectUserDto = InferOutput<typeof SelectUserSchema>;
export type UpdateUserDto = InferOutput<typeof UpdateUserSchema>;

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
export type CreateTaskDto = InferOutput<typeof CreateTaskSchema>;
export type SelectTaskDto = InferOutput<typeof SelectTaskSchema>;
export type UpdateTaskDto = InferOutput<typeof UpdateTaskSchema>;
export type AddToListDto = InferOutput<typeof AddToListSchema>;

/**
 * List types
 */
export type SelectListDto = InferOutput<typeof SelectListSchema>;
export type CreateListDto = InferOutput<typeof CreateListSchema>;
export type UpdateListDto = InferOutput<typeof UpdateTaskSchema>;
