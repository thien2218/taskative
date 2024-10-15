import { CreateBoardDto } from "utils/types";

export const createBoardStub = (): CreateBoardDto => ({
   name: "test",
   description: "test description"
});

export const selectBoardStub = () => ({
   id: "boardId",
   name: "test",
   description: "test description",
   createdAt: new Date(),
   updatedAt: new Date()
});
