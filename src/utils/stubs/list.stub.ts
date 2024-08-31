import { CreateListDto, SelectListDto } from "utils/types";

export const createListStub = (): CreateListDto => ({
   name: "test",
   description: "test description"
});

export const selectListStub = (): SelectListDto => ({
   id: "listId",
   name: "test",
   description: "test description",
   createdAt: new Date(),
   updatedAt: new Date()
});
