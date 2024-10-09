import {
   array,
   check,
   date,
   maxLength,
   minLength,
   nonEmpty,
   nullable,
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
      /^[a-zA-Z0-9]+$/,
      "Task status must be alphanumeric and contain no spaces"
   )
);

export const CreateTaskSchema = object({
   description: pipe(
      string(),
      minLength(3, "Task description must be at least 3 characters long"),
      maxLength(120, "Task description cannot exceed 120 characters")
   ),
   priority: optional(
      picklist(["optional", "low", "medium", "high", "important"]),
      "optional"
   ),
   status: StatusSchema
});

export const SelectTaskSchema = object({
   id: string(),
   description: string(),
   status: string(),
   priority: string(),
   note: nullable(string()),
   createdAt: date(),
   updatedAt: date()
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

export const AddToBoardSchema = object({
   taskIds: array(string())
});
