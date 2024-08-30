import { SelectUserDto } from "../types";

export * from "./auth.stub";
export * from "./task.stub";
export * from "./list.stub";

export const paginationStub = () => ({
   limit: 10,
   offset: 0
});

export const userStubs = (): SelectUserDto[] => [
   {
      id: "1",
      email: "john@gmail.com",
      firstName: "John",
      lastName: "Doe",
      profileImage: null,
      provider: "email",
      createdAt: new Date(),
      updatedAt: new Date()
   },
   {
      id: "2",
      email: "jane@gmail.com",
      firstName: "jane",
      lastName: "Doe",
      profileImage: null,
      provider: "email",
      createdAt: new Date(),
      updatedAt: new Date()
   }
];
