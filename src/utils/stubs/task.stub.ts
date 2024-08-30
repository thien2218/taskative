import { CreateTaskDto, SelectTaskDto } from "utils/types";

export const createTaskStub = (): CreateTaskDto => ({
   description: "Task 1",
   priority: "medium"
});

export const selectTaskStub = (): Omit<
   Omit<SelectTaskDto, "createdAt">,
   "updatedAt"
> => ({
   id: "id",
   description: "Task 1",
   priority: "medium",
   note: null,
   status: "pending"
});
