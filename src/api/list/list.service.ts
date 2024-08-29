import { ResultSet } from "@libsql/client/.";
import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { listsTable, tasksTable } from "database/tables";
import { SelectListSchema, SelectTaskSchema } from "utils/schemas";
import { CreateListDto, PaginationQuery, UpdateListDto } from "utils/types";
import { parse } from "valibot";

@Injectable()
export class ListService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: PaginationQuery) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(listsTable)
         .where(eq(listsTable.userId, sql.placeholder("userId")))
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const lists = (await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError)) as any[];

      if (!lists.length) {
         throw new NotFoundException("No lists found");
      }

      return lists.map((list) => parse(SelectListSchema, list));
   }

   async findOne(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(listsTable)
         .where(
            and(
               eq(listsTable.id, sql.placeholder("id")),
               eq(listsTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const list = await query.get({ id, userId });

      if (!list) {
         throw new NotFoundException("List not found");
      }

      return parse(SelectListSchema, list);
   }

   async findTasks(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(tasksTable)
         .where(
            and(
               eq(tasksTable.listId, sql.placeholder("listId")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const tasks = (await query
         .all({ listId: id, userId })
         .catch(this.dbService.handleDbError)) as any[];

      return tasks.map((task) => parse(SelectTaskSchema, task));
   }

   async create(userId: string, createListDto: CreateListDto) {
      const builder = this.dbService.builder;

      const query = builder
         .insert(listsTable)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            name: sql.placeholder("name"),
            description: sql.placeholder("description")
         })
         .returning()
         .prepare();

      const list = await query
         .run({
            id: nanoid(25),
            userId,
            ...createListDto
         })
         .catch(this.dbService.handleDbError);

      return parse(SelectListSchema, list);
   }

   async addToList(id: string, userId: string, taskIds: string[]) {
      const builder = this.dbService.builder;

      const query = builder
         .update(tasksTable)
         .set({ listId: id })
         .where(
            and(
               inArray(tasksTable.id, sql.placeholder("taskIds")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const { rowsAffected } = (await query
         .run({ taskIds, userId })
         .catch(this.dbService.handleDbError)) as ResultSet;

      return { totalAddedTasks: rowsAffected };
   }

   async update(id: string, userId: string, updateListDto: UpdateListDto) {
      const builder = this.dbService.builder;

      const query = builder
         .update(listsTable)
         .set(updateListDto)
         .where(
            and(
               eq(listsTable.id, sql.placeholder("id")),
               eq(listsTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await query
         .run({ id, userId, ...updateListDto })
         .then(({ rowsAffected }) => {
            if (!rowsAffected) {
               throw new NotFoundException("List not found");
            }
         })
         .catch(this.dbService.handleDbError);
   }

   async delete(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .delete(listsTable)
         .where(
            and(
               eq(listsTable.id, sql.placeholder("id")),
               eq(listsTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await query
         .run({ id, userId })
         .then(({ rowsAffected }) => {
            if (!rowsAffected) {
               throw new NotFoundException("List not found");
            }
         })
         .catch(this.dbService.handleDbError);
   }
}
