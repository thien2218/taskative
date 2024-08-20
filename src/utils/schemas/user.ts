import {
   isoTimestamp,
   nullable,
   object,
   picklist,
   pipe,
   string
} from "valibot";

export const SelectUserSchema = object({
   id: string(),
   email: string(),
   createdAt: pipe(string(), isoTimestamp()),
   profileImage: nullable(string()),
   provider: picklist(["google", "facebook", "email"]),
   firstName: string(),
   lastName: string()
});
