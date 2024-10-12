import { Test, TestingModule } from "@nestjs/testing";
import { BoardService } from "../board.service";
import { DatabaseModule } from "database/database.module";
import { DatabaseService } from "database/database.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { createBoardStub, paginationStub, selectBoardStub } from "utils/stubs";

jest.mock("database/database.service");
jest.mock("nanoid");

describe("BoardService", () => {
   let service: BoardService;
   let dbService: DatabaseService;

   const boardId = "boardId";
   const userId = "userId";

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [DatabaseModule],
         providers: [BoardService]
      }).compile();

      service = module.get<BoardService>(BoardService);
      dbService = module.get<DatabaseService>(DatabaseService);
   });

   describe("create", () => {
      it("should be defined", () => {
         expect(service.create).toBeDefined();
      });

      it("should raise an exception if the board already exists", async () => {
         jest.spyOn(dbService.builder, "run").mockRejectedValueOnce({
            message: "SQLITE_CONSTRAINT: UNIQUE constraint failed: lists.name"
         });

         await expect(
            service.create(userId, createBoardStub())
         ).rejects.toThrow(BadRequestException);
      });

      it("should insert a new board into the database", async () => {
         (nanoid as jest.Mock).mockReturnValueOnce(boardId);
         await service.create(userId, createBoardStub());

         expect(dbService.builder.insert).toHaveBeenCalled();
         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: boardId,
            userId,
            ...createBoardStub()
         });
      });
   });

   describe("findOne", () => {
      it("should be defined", () => {
         expect(service.findOne).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            userId,
            ...selectBoardStub()
         });
      });

      it("should make a select query to the database", async () => {
         await service.findOne(boardId, userId);

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({
            id: boardId,
            userId
         });
      });

      it("should raise an exception if the board does not exist", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValueOnce(undefined);

         await expect(service.findOne(boardId, userId)).rejects.toThrow(
            NotFoundException
         );
      });

      it("should return the board if it exists", async () => {
         const board = await service.findOne(boardId, userId);

         expect(board).toEqual({
            ...selectBoardStub(),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
         });
      });
   });

   describe("findMany", () => {
      it("should be defined", () => {
         expect(service.findMany).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "all").mockResolvedValue([
            {
               id: boardId,
               userId,
               ...createBoardStub(),
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

         expect(lists[0]).toEqual({
            ...selectBoardStub(),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
         });
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

      it("should call an update statement to the database with the board and user id", async () => {
         await service.update(boardId, userId, createBoardStub());

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            updatedAt: expect.any(Date),
            ...createBoardStub()
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: boardId,
            userId
         });
      });

      it("should raise a not found exception if the board does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(
            service.update(boardId, userId, createBoardStub())
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

      it("should make a delete query to the database with the board and user id", async () => {
         await service.delete(boardId, userId);

         expect(dbService.builder.delete).toHaveBeenCalled();
         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: boardId,
            userId
         });
      });

      it("should raise a not found exception if the board does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(service.delete(boardId, userId)).rejects.toThrow(
            NotFoundException
         );
      });
   });
});
