import { UpdateUserDto } from "utils/types";

export const selectUserStub = () => ({
   id: "userId",
   email: "john@gmail.com",
   firstName: "John",
   lastName: "Doe",
   profileImage: null,
   provider: "email",
   createdAt: new Date(),
   updatedAt: new Date()
});

export const updateUserStub = (): UpdateUserDto => ({
   firstName: "Jane",
   lastName: "Doevy"
});
