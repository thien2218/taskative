import {
   isoTimestamp,
   maxLength,
   minLength,
   object,
   picklist,
   pipe,
   string
} from "valibot";

export const CreateTaskSchema = object({
   description: pipe(
      string(),
      minLength(3, "Task description must be at least 3 characters long"),
      maxLength(120, "Task description cannot exceed 120 characters")
   )
});

export const SelectTaskSchema = object({
   id: string(),
   description: string(),
   status: picklist(["pending", "completed", "hiatus", "delayed", "deleted"]),
   createdAt: pipe(string(), isoTimestamp())
});

export const UpdateTaskSchema = object({
   description: pipe(
      string(),
      minLength(3, "Task description must be at least 3 characters long"),
      maxLength(120, "Task description cannot exceed 120 characters")
   ),
   status: picklist(["pending", "completed", "hiatus", "delayed", "deleted"])
});
