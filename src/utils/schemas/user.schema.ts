import {
   date,
   maxLength,
   minLength,
   nullable,
   object,
   optional,
   pipe,
   startsWith,
   string,
   url
} from "valibot";

export const SelectUserSchema = object({
   id: string(),
   email: string(),
   profileImage: nullable(string()),
   provider: string(),
   firstName: string(),
   lastName: string(),
   createdAt: date(),
   updatedAt: date()
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
         url("Invalid profile image URL"),
         startsWith("https://", "Profile image URL must be secure")
      )
   )
});
