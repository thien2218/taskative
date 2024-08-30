import { SelectUserDto, UpdateUserDto } from "utils/types";

export const selectUserStub = (): Omit<
   Omit<SelectUserDto, "updatedAt">,
   "createdAt"
> => ({
   id: "userId",
   email: "john@gmail.com",
   firstName: "John",
   lastName: "Doe",
   profileImage: null,
   provider: "email"
});

export const updateUserStub = (): UpdateUserDto => ({
   firstName: "Jane",
   lastName: "Doevy"
});
