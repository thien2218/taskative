import { CreateTaskDto, SelectTaskDto } from "utils/types";

export const createTaskStub = (): CreateTaskDto => ({
   description: "Task 1",
   priority: "medium"
});

export const selectTaskStub = (): SelectTaskDto => ({
   id: "taskId",
   description: "Task 1",
   priority: "medium",
   note: null,
   status: "pending",
   createdAt: new Date(),
   updatedAt: new Date()
});
