import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user.service";
import { DatabaseModule } from "database/database.module";
import { DatabaseService } from "database/database.service";
import { NotFoundException } from "@nestjs/common";
import { selectUserStub, updateUserStub } from "utils/stubs";

jest.mock("database/database.service");

describe("UserService", () => {
   let service: UserService;
   let dbService: DatabaseService;

   const userId = "userId";

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
            user: selectUserStub(),
            profile: {
               ...selectUserStub(),
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });
      });

      it("should get the user profile from the database", async () => {
         await service.findProfile(userId);

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({ id: userId });
      });

      it("should raise an exception when the user is not found", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue(undefined);

         await expect(service.findProfile(userId)).rejects.toThrow(
            NotFoundException
         );
      });

      it("should return the user profile", async () => {
         const profile = await service.findProfile(userId);
         expect(profile).toMatchObject(selectUserStub());
      });
   });

   describe("update", () => {
      it("should be defined", () => {
         expect(service.update).toBeDefined();
      });

      it("should make an update statement to the database", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 1
         });

         await service.update(userId, updateUserStub());

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            ...updateUserStub(),
            updatedAt: expect.any(Date)
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: userId
         });
      });

      it("should raise an exception when no user record is updated", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(service.update(userId, updateUserStub())).rejects.toThrow(
            NotFoundException
         );
      });
   });
});
