import { users } from "@/database/tables/users";
import { createSelectSchema } from "drizzle-valibot";
import { Input, omit } from "valibot";

export const SelectUserSchema = omit(createSelectSchema(users), [
   "passwordHash",
   "refreshToken",
   "providerId"
]);

export type SelectUserDto = Input<typeof SelectUserSchema>;
