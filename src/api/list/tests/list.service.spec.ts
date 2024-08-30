import { Test, TestingModule } from "@nestjs/testing";
import { ListService } from "../list.service";
import { DatabaseModule } from "database/database.module";
import { DatabaseService } from "database/database.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { createListStub, paginationStub, selectListStub } from "utils/stubs";

jest.mock("database/database.service");
jest.mock("nanoid");

describe("ListService", () => {
   let service: ListService;
   let dbService: DatabaseService;

   const listId = "listId";
   const userId = "userId";

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [DatabaseModule],
         providers: [ListService]
      }).compile();

      service = module.get<ListService>(ListService);
      dbService = module.get<DatabaseService>(DatabaseService);
   });

   describe("create", () => {
      it("should be defined", () => {
         expect(service.create).toBeDefined();
      });

      it("should raise an exception if the list already exists", async () => {
         jest.spyOn(dbService.builder, "run").mockRejectedValueOnce({
            message: "SQLITE_CONSTRAINT: UNIQUE constraint failed: lists.name"
         });

         await expect(service.create(userId, createListStub())).rejects.toThrow(
            BadRequestException
         );
      });

      it("should insert a new list into the database", async () => {
         (nanoid as jest.Mock).mockReturnValueOnce(listId);
         await service.create(userId, createListStub());

         expect(dbService.builder.insert).toHaveBeenCalled();
         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: listId,
            userId,
            ...createListStub()
         });
      });
   });

   describe("findOne", () => {
      it("should be defined", () => {
         expect(service.findOne).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            id: listId,
            userId,
            ...createListStub()
         });
      });

      it("should make a select query to the database", async () => {
         await service.findOne(listId, userId);

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({
            id: listId,
            userId
         });
      });

      it("should raise an exception if the list does not exist", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValueOnce(undefined);

         await expect(service.findOne(listId, userId)).rejects.toThrow(
            NotFoundException
         );
      });

      it("should return the list if it exists", async () => {
         const list = await service.findOne(listId, userId);
         expect(list).toEqual(selectListStub());
      });
   });

   describe("findMany", () => {
      it("should be defined", () => {
         expect(service.findMany).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "all").mockResolvedValue([
            {
               id: listId,
               userId,
               ...createListStub(),
               createdAt: new Date(),
               updatedAt: new Date()
            }
         ]);
      });

      it("should make a select query to the database", async () => {
         await service.findMany(userId, paginationStub());

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.all).toHaveBeenCalledWith({
            userId,
            ...paginationStub()
         });
      });

      it("should raise an exception if there are no lists found", async () => {
         jest.spyOn(dbService.builder, "all").mockResolvedValueOnce([]);

         await expect(
            service.findMany(userId, paginationStub())
         ).rejects.toThrow(NotFoundException);
      });

      it("should return a parsed array of lists", async () => {
         const lists = await service.findMany(userId, paginationStub());
         expect(lists[0]).toMatchObject(selectListStub());
      });
   });

   describe("update", () => {
      it("should be defined", () => {
         expect(service.update).toBeDefined();
      });

      beforeAll(() => {
         (dbService.builder.run as jest.Mock).mockResolvedValue({
            rowsAffected: 1
         });
      });

      it("should call an update statement to the database with the list and user id", async () => {
         await service.update(listId, userId, createListStub());

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            updatedAt: expect.any(Date),
            ...createListStub()
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: listId,
            userId
         });
      });

      it("should raise a not found exception if the list does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(
            service.update(listId, userId, createListStub())
         ).rejects.toThrow(NotFoundException);
      });
   });

   describe("delete", () => {
      it("should be defined", () => {
         expect(service.delete).toBeDefined();
      });

      beforeAll(() => {
         (dbService.builder.run as jest.Mock).mockResolvedValue({
            rowsAffected: 1
         });
      });

      it("should make a delete query to the database with the list and user id", async () => {
         await service.delete(listId, userId);

         expect(dbService.builder.delete).toHaveBeenCalled();
         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: listId,
            userId
         });
      });

      it("should raise a not found exception if the list does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(service.delete(listId, userId)).rejects.toThrow(
            NotFoundException
         );
      });
   });
});
