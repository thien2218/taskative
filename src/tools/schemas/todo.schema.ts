import { Input, boolean, minLength, object, optional, string } from "valibot";

/**
 * Schemas
 */
export const CreateTodoSchema = object({
   description: string([minLength(3)])
});

export const UpdateTodoSchema = object({
   description: optional(string([minLength(3)])),
   completed: optional(boolean())
});

export const SelectTodoSchema = object({
   id: string(),
   description: string(),
   completed: boolean()
});

/**
 * Types
 */
export type CreateTodo = Input<typeof CreateTodoSchema>;
export type UpdateTodo = Input<typeof UpdateTodoSchema>;
export type SelectTodo = Input<typeof SelectTodoSchema>;
