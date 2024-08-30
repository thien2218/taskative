import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { DatabaseModule } from "database/database.module";
import { DatabaseService } from "database/database.service";
import { NotFoundException } from "@nestjs/common";

jest.mock("database/database.service");

describe("UserService", () => {
   let service: UserService;
   let dbService: DatabaseService;

   beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [DatabaseModule],
         providers: [UserService]
      }).compile();

      service = module.get<UserService>(UserService);
      dbService = module.get<DatabaseService>(DatabaseService);
   });

   describe("findProfile", () => {
      it("should be defined", () => {
         expect(service.findProfile).toBeDefined();
      });

      beforeEach(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            user: {
               id: "id",
               email: "test@gmail.com",
               encodedPassword: "123",
               encodedRefreshToken: null,
               provider: "facebook"
            },
            profile: {
               firstName: "Test",
               lastName: "User",
               profileImage: null,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });
      });

      it("should get the user profile from the database", async () => {
         await service.findProfile("123");

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({ id: "123" });
      });

      it("should raise an exception when the user is not found", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue(undefined);

         await expect(service.findProfile("id")).rejects.toThrow(
            NotFoundException
         );
      });

      it("should return the user profile", async () => {
         const profile = await service.findProfile("id");

         expect(profile).toMatchObject({
            id: "id",
            email: "test@gmail.com",
            profileImage: null,
            firstName: "Test",
            lastName: "User",
            provider: "facebook"
         });
      });
   });

   describe("update", () => {
      it("should be defined", () => {
         expect(service.update).toBeDefined();
      });

      it("should make an update statement to the database", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValue({
            rowsAffected: 1
         });

         await service.update("id", { firstName: "John" });

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            firstName: "John",
            updatedAt: expect.any(Date)
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: "id"
         });
      });

      it("should raise an exception when no user record is updated", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValue({
            rowsAffected: 0
         });

         await expect(
            service.update("id", { firstName: "John" })
         ).rejects.toThrow(NotFoundException);
      });
   });
});
