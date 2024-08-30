import { CreateListDto } from "utils/types";

export const createListStub = (): CreateListDto => ({
   name: "test",
   description: "test description"
});

export const selectListStub = () => ({
   id: "listId",
   ...createListStub()
});
