import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "src/database/database.service";
import { tasks } from "src/database/tables";
import { SelectTaskSchema } from "src/utils/schemas";
import { CreateTaskDto, PaginationQuery, UpdateTaskDto } from "src/utils/types";
import { parse } from "valibot";

@Injectable()
export class TaskService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(pagination: PaginationQuery, userId: string) {
      const { limit, offset } = pagination;
      const builder = this.dbService.builder;

      const prepared = builder
         .select()
         .from(tasks)
         .where(eq(tasks.userId, sql.placeholder("userId")))
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const taskList = await prepared.all({ userId, limit, offset });

      if (!taskList.length) {
         throw new NotFoundException("No more tasks found");
      }

      return taskList.map((task) => parse(SelectTaskSchema, task));
   }

   async findOne(id: string, userId: string) {
      const builder = this.dbService.builder;

      const prepared = builder
         .select()
         .from(tasks)
         .where(
            and(
               eq(tasks.id, sql.placeholder("id")),
               eq(tasks.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const task = await prepared.get({ id, userId });

      if (!task) {
         throw new NotFoundException("Task not found");
      }

      return parse(SelectTaskSchema, task);
   }

   async create(userId: string, { description }: CreateTaskDto) {
      const builder = this.dbService.builder;

      const prepared = builder
         .insert(tasks)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            description: sql.placeholder("description")
         })
         .prepare();

      await prepared
         .run({
            id: nanoid(25),
            userId,
            description
         })
         .catch(this.dbService.handleDbError);
   }

   async update(
      id: string,
      userId: string,
      { description, status }: UpdateTaskDto
   ) {
      const builder = this.dbService.builder;
      const updatedAt = new Date();

      const prepared = builder
         .update(tasks)
         .set({ description, status, updatedAt })
         .where(
            and(
               eq(tasks.id, sql.placeholder("id")),
               eq(tasks.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await prepared.run({ id, userId }).catch(this.dbService.handleDbError);
   }

   async delete(id: string, userId: string) {
      const builder = this.dbService.builder;

      const prepared = builder
         .update(tasks)
         .set({ status: "deleted" })
         .where(
            and(
               eq(tasks.id, sql.placeholder("id")),
               eq(tasks.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await prepared.run({ id, userId }).catch(this.dbService.handleDbError);
   }
}
