import { Input, Output } from "valibot";
import { LoginSchema, SignupSchema } from "../schemas/auth.schema";

export type SignupDto = Output<typeof SignupSchema>;
export type LoginDto = Input<typeof LoginSchema>;
