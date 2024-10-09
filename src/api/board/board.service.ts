import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { boardsTable, tasksTable } from "database/tables";
import { SelectBoardSchema, SelectTaskSchema } from "utils/schemas";
import { CreateBoardDto, PaginationQuery, UpdateBoardDto } from "utils/types";
import { parse } from "valibot";

@Injectable()
export class BoardService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: PaginationQuery) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(boardsTable)
         .where(eq(boardsTable.userId, sql.placeholder("userId")))
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const boards = (await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError)) as any[];

      if (!boards.length) {
         throw new NotFoundException("No boards found");
      }

      return boards.map((board) => parse(SelectBoardSchema, board));
   }

   async findOne(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(boardsTable)
         .where(
            and(
               eq(boardsTable.id, sql.placeholder("id")),
               eq(boardsTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const board = await query.get({ id, userId });

      if (!board) {
         throw new NotFoundException("Board not found");
      }

      return parse(SelectBoardSchema, board);
   }

   async findTasks(id: string, userId: string) {
      const builder = this.dbService.builder;

      const query = builder
         .select()
         .from(tasksTable)
         .where(
            and(
               eq(tasksTable.boardId, sql.placeholder("boardId")),
               eq(tasksTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const tasks = (await query
         .all({ boardId: id, userId })
         .catch(this.dbService.handleDbError)) as any[];

      return tasks.map((task) => parse(SelectTaskSchema, task));
   }

   async create(userId: string, createBoardDto: CreateBoardDto) {
      const builder = this.dbService.builder;

      const query = builder
         .insert(boardsTable)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            name: sql.placeholder("name"),
            description: sql.placeholder("description")
         })
         .prepare();

      await query
         .run({
            id: nanoid(25),
            userId,
            ...createBoardDto
         })
         .catch(this.dbService.handleDbError);
   }

   async addToBoard(id: string, userId: string, taskIds: string[]) {
      const builder = this.dbService.builder;

      const query = builder
         .update(tasksTable)
         .set({ boardId: id })
         .where(
            and(inArray(tasksTable.id, taskIds), eq(tasksTable.userId, userId))
         )
         .returning({ taskId: tasksTable.id });

      const validIds = await query.all().catch(this.dbService.handleDbError);

      if (!validIds || !validIds.length) {
         throw new NotFoundException("Tasks not found");
      }

      return {
         message: `${validIds.length}/${taskIds.length} tasks added to board successfully`,
         tasksAdded: validIds.map(({ taskId }) => taskId)
      };
   }

   async update(id: string, userId: string, updateBoardDto: UpdateBoardDto) {
      const builder = this.dbService.builder;

      const query = builder
         .update(boardsTable)
         .set({ ...updateBoardDto, updatedAt: new Date() })
         .where(
            and(
               eq(boardsTable.id, sql.placeholder("id")),
               eq(boardsTable.userId, sql.placeholder("userId"))
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
         .delete(boardsTable)
         .where(
            and(
               eq(boardsTable.id, sql.placeholder("id")),
               eq(boardsTable.userId, sql.placeholder("userId"))
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
