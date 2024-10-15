import {
   array,
   check,
   length,
   maxLength,
   minLength,
   nanoid,
   object,
   optional,
   partial,
   pipe,
   string
} from "valibot";

export const CreateListSchema = object({
   name: pipe(
      string(),
      minLength(3, "List name must be at least 3 characters long"),
      maxLength(100, "List name must be at most 100 characters long")
   ),
   description: optional(
      pipe(
         string(),
         minLength(1, "Description is required"),
         maxLength(500, "Description must be at most 500 characters long")
      )
   )
});

export const UpdateListSchema = pipe(
   partial(CreateListSchema),
   check(
      (v) => Object.keys(v).length > 0,
      "At least one field must be provided to update a list"
   )
);

export const ListTaskIDsSchema = pipe(
   array(
      pipe(string(), nanoid("Invalid task ID"), length(25, "Invalid task ID")),
      "List of task IDs must be an array"
   ),
   minLength(1, "At least one task ID must be provided")
);
