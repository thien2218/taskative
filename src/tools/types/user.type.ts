import { Input } from "valibot";
import { SelectUserSchema } from "../schemas/user.schema";

export type SelectUserDto = Input<typeof SelectUserSchema>;

export type UserRefresh = SelectUserDto & {
   refreshToken: string;
   exp: number;
};
