import {
   date,
   maxLength,
   minLength,
   nullable,
   object,
   optional,
   picklist,
   pipe,
   startsWith,
   string,
   url
} from "valibot";

export const SelectUserSchema = object({
   id: string(),
   email: string(),
   createdAt: date(),
   profileImage: nullable(string()),
   provider: picklist(["google", "facebook", "email"]),
   firstName: string(),
   lastName: string()
});

export const UpdateUserSchema = object({
   firstName: optional(
      pipe(
         string(),
         minLength(3, "First name must be at least 3 characters long"),
         maxLength(50, "First name cannot exceed 50 characters")
      )
   ),
   lastName: optional(
      pipe(
         string(),
         minLength(3, "Last name must be at least 3 characters long"),
         maxLength(50, "Last name cannot exceed 50 characters")
      )
   ),
   profileImage: optional(
      pipe(
         string(),
         url("Invalid image URL"),
         startsWith("https://", "Image URL must be secure")
      )
   )
});
