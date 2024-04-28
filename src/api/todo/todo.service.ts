import { DatabaseService } from "@/database/database.service";
import { todos } from "@/database/tables";
import {
   CreateTodoDto,
   SelectTodoSchema,
   UpdateTodoDto
} from "@/tools/schemas/todo.schema";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parse } from "valibot";

@Injectable()
export class TodoService {
   constructor(private readonly dbService: DatabaseService) {}

   async create(createTodoDto: CreateTodoDto) {
      const db = this.dbService.getDb();

      const prepared = db
         .insert(todos)
         .values({
            id: nanoid(25),
            description: createTodoDto.description
         })
         .returning()
         .prepare();

      const todo = await prepared.get();

      return todo;
   }

   async findMany(page: number, limit: number) {
      const db = this.dbService.getDb();

      const prepared = db
         .select()
         .from(todos)
         .limit(limit)
         .offset(page * limit)
         .prepare();

      const todoList = await prepared.all();
      return todoList;
   }

   async findOne(id: string) {
      const db = this.dbService.getDb();

      const prepared = db
         .select()
         .from(todos)
         .where(eq(todos.id, id))
         .prepare();

      const todo = await prepared.get().catch(this.dbService.handleDbError);
      return parse(SelectTodoSchema, todo);
   }

   async update(id: string, updateTodoDto: UpdateTodoDto) {
      const db = this.dbService.getDb();

      const prepared = db
         .update(todos)
         .set(updateTodoDto)
         .where(eq(todos.id, id))
         .returning()
         .prepare();

      const todo = await prepared.get();
      return todo;
   }

   delete(id: string) {
      const db = this.dbService.getDb();
      const prepared = db.delete(todos).where(eq(todos.id, id)).prepare();
      prepared.execute();
   }
}
