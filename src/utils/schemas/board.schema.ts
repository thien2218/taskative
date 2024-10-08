import { check, date, nullable, object, optional, pipe, string } from "valibot";

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

export const UpdateBoardSchema = pipe(
   object({
      name: optional(string()),
      description: optional(string())
   }),
   check(
      ({ name, description }) => !!name || !!description,
      "At least one field must be provided"
   )
);
