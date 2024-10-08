import {
   array,
   check,
   date,
   maxLength,
   minLength,
   nullable,
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
   ),
   priority: optional(
      picklist(["optional", "low", "medium", "high", "important"]),
      "optional"
   )
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
   object({
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
      ),
      note: optional(string())
   }),
   check(
      (values) => Object.keys(values).length > 0,
      "At least one field must be provided to update task"
   )
);

export const AddToBoardSchema = object({
   taskIds: array(string())
});
