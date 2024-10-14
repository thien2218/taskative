import { NoteContentSchema } from "utils/schemas";
import {
   CreateBoardSchema,
   CreateListSchema,
   CreateTaskSchema,
   LoginSchema,
   PageSchema,
   SignupSchema,
   UpdateBoardSchema,
   UpdateListSchema,
   UpdateTaskSchema,
   UpdateUserSchema
} from "../schemas";
import { InferOutput } from "valibot";

/**
 * Query types
 */
export type Page = InferOutput<typeof PageSchema>;

/**
 * Auth types
 */
export type LoginDto = InferOutput<typeof LoginSchema>;

export type SignupDto = InferOutput<typeof SignupSchema>;

export type AuthTokens = {
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
export type UpdateUserDto = InferOutput<typeof UpdateUserSchema>;

export type TUser = {
   userId: string;
   email: string;
   firstName: string;
   lastName: string;
   profileImage?: string | null;
};

/**
 * OAuth user types
 */
export type GoogleOAuthProfile = {
   emails: { value: string; verified: boolean }[];
   name: { givenName: string; familyName: string };
   photos: { value: string }[];
};

export type OAuthValidateDto = {
   email: string;
   firstName: string;
   lastName: string;
   profileImage?: string;
   provider: "google" | "facebook";
};

/**
 * Task types
 */
export type CreateTaskDto = InferOutput<typeof CreateTaskSchema>;
export type UpdateTaskDto = InferOutput<typeof UpdateTaskSchema>;

/**
 * Board types
 */
export type CreateBoardDto = InferOutput<typeof CreateBoardSchema>;
export type UpdateBoardDto = InferOutput<typeof UpdateBoardSchema>;

/**
 * List types
 */
export type CreateListDto = InferOutput<typeof CreateListSchema>;
export type UpdateListDto = InferOutput<typeof UpdateListSchema>;

/**
 * Note types
 */
export type NoteContentDto = InferOutput<typeof NoteContentSchema>;
