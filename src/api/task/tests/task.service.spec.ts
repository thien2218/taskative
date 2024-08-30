import { Test, TestingModule } from "@nestjs/testing";
import { TaskService } from "../task.service";
import { DatabaseModule } from "database/database.module";
import { DatabaseService } from "database/database.service";
import { nanoid } from "nanoid";
import { NotFoundException } from "@nestjs/common";
import { createTaskStub, paginationStub, selectTaskStub } from "utils/stubs";

jest.mock("database/database.service");
jest.mock("nanoid");

describe("TaskService", () => {
   let service: TaskService;
   let dbService: DatabaseService;

   const taskId = "taskId";
   const userId = "userId";

   beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [DatabaseModule],
         providers: [TaskService]
      }).compile();

      service = module.get<TaskService>(TaskService);
      dbService = module.get<DatabaseService>(DatabaseService);
   });

   describe("create", () => {
      it("should be defined", () => {
         expect(service.create).toBeDefined();
      });

      it("should call an insert statement to the database", async () => {
         (nanoid as jest.Mock).mockReturnValue(taskId);

         await service.create(userId, createTaskStub());

         expect(dbService.builder.insert).toHaveBeenCalled();

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: taskId,
            userId,
            description: "Task 1",
            priority: "medium"
         });
      });
   });

   describe("findOne", () => {
      it("should be defined", () => {
         expect(service.findOne).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            ...selectTaskStub(),
            createdAt: new Date(),
            updatedAt: new Date()
         });
      });

      it("should call a select statement to the database with the task and user id", async () => {
         await service.findOne(taskId, userId);

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({
            id: taskId,
            userId
         });
      });

      it("should throw a not found exception if the task does not exist", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValueOnce(undefined);

         await expect(service.findOne(userId, taskId)).rejects.toThrow(
            NotFoundException
         );
      });

      it("should return the task if it exists", async () => {
         const task = await service.findOne(userId, taskId);
         expect(task).toMatchObject(selectTaskStub());
      });
   });

   describe("findMany", () => {
      it("should be defined", () => {
         expect(service.findMany).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "all").mockResolvedValue([
            {
               ...selectTaskStub(),
               userId,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         ]);
      });

      it("should call a select statement to the database with the user id", async () => {
         await service.findMany(userId, paginationStub());

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.all).toHaveBeenCalledWith({
            userId,
            ...paginationStub()
         });
      });

      it("should raise a not found exception if the user does not have any tasks", async () => {
         jest.spyOn(dbService.builder, "all").mockResolvedValueOnce([]);

         await expect(
            service.findMany(userId, paginationStub())
         ).rejects.toThrow(NotFoundException);
      });

      it("should return a parsed array of tasks if they exist", async () => {
         const tasks = await service.findMany(userId, paginationStub());
         expect(tasks[0]).toMatchObject(selectTaskStub());
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

      it("should call an update statement to the database with the task and user id", async () => {
         await service.update(taskId, userId, createTaskStub());

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            updatedAt: expect.any(Date),
            ...createTaskStub()
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: taskId,
            userId
         });
      });

      it("should raise a not found exception if the task does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(
            service.update(taskId, userId, createTaskStub())
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

      it("should make a delete query to the database with the task and user id", async () => {
         await service.delete(taskId, userId);

         expect(dbService.builder.delete).toHaveBeenCalled();
         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: taskId,
            userId
         });
      });

      it("should throw a not found exception if the task does not exist", async () => {
         (dbService.builder.run as jest.Mock).mockResolvedValueOnce({
            rowsAffected: 0
         });

         await expect(service.delete(taskId, userId)).rejects.toThrow(
            NotFoundException
         );
      });
   });
});
