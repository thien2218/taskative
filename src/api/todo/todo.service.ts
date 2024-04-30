import { DatabaseService } from "@/database/database.service";
import { todos } from "@/database/tables";
import {
   CreateTodoDto,
   SelectTodoSchema,
   UpdateTodoDto
} from "@/tools/schemas/todo.schema";
import { ResultSet } from "@libsql/client/.";
import {
   BadRequestException,
   Injectable,
   NotFoundException
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parse } from "valibot";

@Injectable()
export class TodoService {
   constructor(private readonly dbService: DatabaseService) {}

   async create(userId: string, createTodoDto: CreateTodoDto) {
      const db = this.dbService.getDb();

      const prepared = db
         .insert(todos)
         .values({
            id: sql.placeholder("id"),
            description: sql.placeholder("description"),
            userId: sql.placeholder("userId")
         })
         .returning()
         .prepare();

      const todo = await prepared
         .get({
            id: nanoid(25),
            description: createTodoDto.description,
            userId
         })
         .catch(this.dbService.handleDbError);

      return parse(SelectTodoSchema, todo);
   }

   async findMany(userId: string, page: number, limit: number) {
      const db = this.dbService.getDb();
      const prepared = db
         .select()
         .from(todos)
         .limit(limit)
         .offset(page * limit)
         .where(eq(todos.userId, sql.placeholder("userId")))
         .prepare();

      const todoList = await prepared
         .all({ userId })
         .catch(this.dbService.handleDbError);

      if (!todoList) throw new NotFoundException("No todos found");
      return todoList.map((todo) => parse(SelectTodoSchema, todo));
   }

   async findOne(id: string, userId: string) {
      const db = this.dbService.getDb();
      const prepared = db
         .select()
         .from(todos)
         .where(
            and(
               eq(todos.id, sql.placeholder("id")),
               eq(todos.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const todo = await prepared
         .get({ id, userId })
         .catch(this.dbService.handleDbError);

      if (!todo) throw new NotFoundException("Todo not found");
      return parse(SelectTodoSchema, todo);
   }

   async update(id: string, userId: string, updateTodoDto: UpdateTodoDto) {
      const db = this.dbService.getDb();
      const prepared = db
         .update(todos)
         .set({ ...updateTodoDto })
         .where(
            and(
               eq(todos.id, sql.placeholder("id")),
               eq(todos.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const { rowsAffected } = (await prepared
         .run({ id, userId })
         .catch(this.dbService.handleDbError)) as ResultSet;

      if (rowsAffected === 0) throw new BadRequestException("Todo not found");
   }

   async delete(id: string, userId: string) {
      const db = this.dbService.getDb();
      const prepared = db
         .delete(todos)
         .where(
            and(
               eq(todos.id, sql.placeholder("id")),
               eq(todos.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const { rowsAffected } = (await prepared
         .run({ id, userId })
         .catch(this.dbService.handleDbError)) as ResultSet;

      if (rowsAffected === 0) throw new BadRequestException("Todo not found");
   }
}
