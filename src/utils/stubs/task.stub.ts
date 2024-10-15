import { CreateTaskDto } from "utils/types";

export const createTaskStub = (): CreateTaskDto => ({
   description: "Task 1",
   priority: "medium",
   status: "pending"
});

export const selectTaskStub = () => ({
   id: "taskId",
   description: "Task 1",
   priority: "medium",
   note: null,
   status: "pending",
   createdAt: new Date(),
   updatedAt: new Date()
});
