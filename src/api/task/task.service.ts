import {
   BadRequestException,
   Injectable,
   NotFoundException
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { boardsTable, tasksTable } from "database/tables";
import { CreateTaskDto, PaginationQuery, UpdateTaskDto } from "utils/types";

@Injectable()
export class TaskService {
   private readonly taskColumns = {
      description: tasksTable.description,
      priority: tasksTable.priority,
      status: tasksTable.status,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt
   };

   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: PaginationQuery) {
      const builder = this.dbService.builder;

      const query = builder
         .select({ ...this.taskColumns, id: tasksTable.id })
         .from(tasksTable)
         .where(eq(tasksTable.userId, sql.placeholder("userId")))
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const tasks = await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!tasks || !tasks.length) {
         throw new NotFoundException("No tasks found");
      }

      return tasks;
   }

   async findOne(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select({ ...this.taskColumns, note: tasksTable.note })
         .from(tasksTable)
         .where(
            and(
               eq(tasksTable.id, sql.placeholder("id")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const task = await query.get({ id, userId });

      if (!task) {
         throw new NotFoundException("Task not found");
      }

      return task;
   }

   async create(userId: string, boardId: string, createTaskDto: CreateTaskDto) {
      const builder = this.dbService.builder;
      const id = nanoid(25);

      await this.validateStatus(boardId, createTaskDto.status);

      const query = builder
         .insert(tasksTable)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            boardId: sql.placeholder("boardId"),
            description: sql.placeholder("description"),
            priority: sql.placeholder("priority"),
            status: sql.placeholder("status")
         })
         .prepare();

      await query
         .run({ id, userId, ...createTaskDto })
         .catch(this.dbService.handleDbError);

      return { id };
   }

   async update(
      id: string,
      userId: string,
      boardId: string,
      updateTaskDto: UpdateTaskDto
   ) {
      const builder = this.dbService.builder;
      const updatedAt = new Date();

      if (updateTaskDto.status) {
         await this.validateStatus(boardId, updateTaskDto.status);
      }

      const query = builder
         .update(tasksTable)
         .set({ ...updateTaskDto, updatedAt })
         .where(
            and(
               eq(tasksTable.id, sql.placeholder("id")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await query
         .run({ id, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }

   async delete(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .delete(tasksTable)
         .where(
            and(
               eq(tasksTable.id, sql.placeholder("id")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await query
         .run({ id, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }

   private async validateStatus(boardId: string, status: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select({ pipeline: boardsTable.pipeline })
         .from(boardsTable)
         .where(eq(boardsTable.id, sql.placeholder("boardId")))
         .prepare();

      const data = await query
         .get({ boardId })
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
