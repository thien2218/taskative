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
export type CreateTodoDto = Input<typeof CreateTodoSchema>;
export type UpdateTodoDto = Input<typeof UpdateTodoSchema>;
export type SelectTodoDto = Input<typeof SelectTodoSchema>;
