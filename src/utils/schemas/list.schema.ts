import { check, date, nullable, object, optional, pipe, string } from "valibot";

export const SelectListSchema = object({
   id: string(),
   name: string(),
   description: nullable(string()),
   createdAt: date(),
   updatedAt: date()
});

export const CreateListSchema = object({
   name: string(),
   description: optional(string())
});

export const UpdateListSchema = pipe(
   object({
      name: optional(string()),
      description: optional(string())
   }),
   check(
      ({ name, description }) => !!name || !!description,
      "At least one field must be provided"
   )
);
