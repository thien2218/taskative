import {
   array,
   check,
   date,
   maxLength,
   nonEmpty,
   nullable,
   object,
   optional,
   pipe,
   regex,
   startsWith,
   string
} from "valibot";

export const SelectBoardSchema = object({
   id: string(),
   name: string(),
   description: nullable(string()),
   createdAt: date(),
   updatedAt: date()
});

export const CreateBoardSchema = object({
   name: string(),
   description: optional(string())
});

const StatusSchema = object({
   name: pipe(
      string(),
      nonEmpty("Status name cannot be empty"),
      maxLength(30, "Status name cannot exceed 30 characters")
   ),
   color: pipe(
      string(),
      regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code"),
      startsWith("#", "Color must be a valid hex code")
   )
});

export const UpdateBoardSchema = pipe(
   object({
      name: optional(
         pipe(
            string(),
            nonEmpty("Board name cannot be empty"),
            maxLength(100, "Board name cannot exceed 100 characters")
         )
      ),
      description: optional(
         pipe(
            string(),
            nonEmpty("Description cannot be empty"),
            maxLength(1000, "Description cannot exceed 1000 characters")
         )
      ),
      statuses: optional(
         pipe(
            array(StatusSchema),
            nonEmpty("At least one status must be provided")
         )
      )
   }),
   check(
      ({ name, description }) => !!name || !!description,
      "At least one field must be provided"
   )
);
