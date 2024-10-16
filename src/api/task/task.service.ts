import {
   BadRequestException,
   Injectable,
   NotFoundException
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { tasksTable } from "database/tables";
import { CreateTaskDto, Page, UpdateTaskDto } from "utils/types";

@Injectable()
export class TaskService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(boardId: string, userId: string, page: Page) {
      const query = this.dbService.prepared.findTasksQuery;

      const tasks = await query
         .all({ boardId, userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!tasks || !tasks.length) {
         throw new NotFoundException("No tasks found");
      }

      return tasks;
   }

   async findOne(id: string, userId: string) {
      const query = this.dbService.prepared.findTaskQuery;

      const task = await query.get({ id, userId });

      if (!task) {
         throw new NotFoundException("Task not found");
      }

      return task;
   }

   async create(boardId: string, userId: string, createTaskDto: CreateTaskDto) {
      const id = nanoid(25);

      await this.validateStatus(boardId, userId, createTaskDto.status);

      const query = this.dbService.builder
         .insert(tasksTable)
         .values({ id, userId, boardId, ...createTaskDto });

      await query.run().catch(this.dbService.handleDbError);

      return { message: "Task created successfully", id };
   }

   async update(
      id: string,
      boardId: string,
      userId: string,
      updateTaskDto: UpdateTaskDto
   ) {
      if (updateTaskDto.status) {
         await this.validateStatus(boardId, userId, updateTaskDto.status);
      }

      const query = this.dbService.builder
         .update(tasksTable)
         .set({ ...updateTaskDto, updatedAt: new Date() })
         .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));

      await query
         .run()
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }

   async delete(id: string, userId: string) {
      const query = this.dbService.prepared.deleteTaskQuery;

      await query
         .run({ id, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }

   private async validateStatus(
      boardId: string,
      userId: string,
      status: string
   ) {
      const query = this.dbService.prepared.getBoardPipelineQuery;

      const data = await query
         .get({ boardId, userId })
         .catch(this.dbService.handleDbError);

      if (!data) {
         throw new NotFoundException("Board not found");
      }

      const statuses = data.pipeline.map(({ name }) => name);

      if (!statuses.includes(status)) {
         throw new BadRequestException("Invalid status for board");
      }
   }
}
