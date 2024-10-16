import {
   array,
   check,
   length,
   maxLength,
   minLength,
   nanoid,
   nonEmpty,
   object,
   optional,
   partial,
   picklist,
   pipe,
   regex,
   string
} from "valibot";

export const StatusSchema = pipe(
   string(),
   nonEmpty("Task status cannot be empty"),
   maxLength(30, "Task status cannot exceed 30 characters"),
   regex(
      /^[a-z0-9_-]+$/,
      "Task status characters must be lowercase alphanumeric and contain no spaces"
   )
);

export const CreateTaskSchema = object({
   description: pipe(
      string(),
      minLength(3, "Task description must be at least 3 characters long"),
      maxLength(120, "Task description cannot exceed 120 characters")
   ),
   priority: picklist(
      ["optional", "low", "medium", "high", "important"],
      "Task priority must be one of: optional, low, medium, high, important"
   ),
   status: StatusSchema,
   listId: optional(
      pipe(string(), nanoid("Invalid list ID"), length(25, "Invalid list ID"))
   ),
   note: optional(
      pipe(
         string(),
         nonEmpty("Task note cannot be empty"),
         maxLength(2000, "Task note cannot exceed 2000 characters")
      )
   )
});

export const UpdateTaskSchema = pipe(
   partial(
      object({
         ...CreateTaskSchema.entries,
         note: string()
      })
   ),
   check(
      (values) => Object.keys(values).length > 0,
      "At least one field must be provided to update task"
   )
);

export const TaskIDsSchema = pipe(
   array(
      pipe(string(), nanoid("Invalid task ID"), length(25, "Invalid task ID")),
      "List of task IDs must be an array"
   ),
   minLength(1, "At least one task ID must be provided")
);
