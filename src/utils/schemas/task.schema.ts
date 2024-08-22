import {
   date,
   maxLength,
   minLength,
   object,
   optional,
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
   status: string(),
   priority: string(),
   createdAt: date(),
   updatedAt: date()
});

export const UpdateTaskSchema = object({
   description: optional(
      pipe(
         string(),
         minLength(3, "Task description must be at least 3 characters long"),
         maxLength(120, "Task description cannot exceed 120 characters")
      )
   ),
   status: optional(picklist(["pending", "completed", "hiatus"])),
   priority: optional(
      picklist(["optional", "low", "medium", "high", "important"])
   )
});
