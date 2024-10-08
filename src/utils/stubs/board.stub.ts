import { CreateBoardDto, SelectBoardDto } from "utils/types";

export const createBoardStub = (): CreateBoardDto => ({
   name: "test",
   description: "test description"
});

export const selectBoardStub = (): SelectBoardDto => ({
   id: "boardId",
   name: "test",
   description: "test description",
   createdAt: new Date(),
   updatedAt: new Date()
});
