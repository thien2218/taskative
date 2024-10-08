import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { tasksTable } from "database/tables";
import { SelectTaskSchema } from "utils/schemas";
import { CreateTaskDto, PaginationQuery, UpdateTaskDto } from "utils/types";
import { parse } from "valibot";

@Injectable()
export class TaskService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: PaginationQuery) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(tasksTable)
         .where(eq(tasksTable.userId, sql.placeholder("userId")))
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const tasks = (await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError)) as any[];

      if (!tasks.length) {
         throw new NotFoundException("No tasks found");
      }

      return tasks.map((task) => parse(SelectTaskSchema, task));
   }

   async findOne(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
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

      return parse(SelectTaskSchema, task);
   }

   async create(userId: string, createTaskDto: CreateTaskDto) {
      const builder = this.dbService.builder;

      const query = builder
         .insert(tasksTable)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            description: sql.placeholder("description"),
            priority: sql.placeholder("priority")
         })
         .prepare();

      await query
         .run({
            id: nanoid(25),
            userId,
            ...createTaskDto
         })
         .catch(this.dbService.handleDbError);
   }

   async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
      const builder = this.dbService.builder;
      const updatedAt = new Date();

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
            if (resultSet && !resultSet.rowsAffected) {
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
            if (resultSet && !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }
}
