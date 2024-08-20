import { JwtPayloadSchema, LoginSchema, SignupSchema } from "../schemas";
import { InferInput, InferOutput } from "valibot";

export type LoginDto = InferInput<typeof LoginSchema>;

export type SignupDto = InferOutput<typeof SignupSchema>;

export type AuthTokensDto = {
   accessToken: string;
   refreshToken: string;
};

export type JwtPayload = { exp: number } & InferOutput<typeof JwtPayloadSchema>;
