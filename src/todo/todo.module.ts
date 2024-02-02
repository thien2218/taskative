import { Module } from "@nestjs/common";
import { TodoService } from "todo/todo.service";
import { TodoController } from "todo/todo.controller";
import { DatabaseModule } from "@/database/database.module";

@Module({
   imports: [DatabaseModule],
   controllers: [TodoController],
   providers: [TodoService]
})
export class TodoModule {}
