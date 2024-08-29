import { SignupDto, SelectUserDto } from "../types";

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

export const signupStub = (): SignupDto => ({
   email: "test@email.com",
   password: "123456",
   firstName: "Test",
   lastName: "User",
   profileImage: "https://example.com"
});
