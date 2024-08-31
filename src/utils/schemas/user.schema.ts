import {
   check,
   date,
   maxLength,
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

export const UpdateUserSchema = pipe(
   object({
      firstName: optional(
         pipe(string(), maxLength(32, "First name cannot exceed 32 characters"))
      ),
      lastName: optional(
         pipe(string(), maxLength(32, "Last name cannot exceed 32 characters"))
      ),
      profileImage: optional(
         pipe(
            string(),
            url("Invalid profile image URL"),
            startsWith("https://", "Profile image URL must be secure")
         )
      )
   }),
   check(
      ({ firstName, lastName, profileImage }) =>
         !!firstName || !!lastName || !!profileImage,
      "At least one field must be provided to update profile"
   )
);
