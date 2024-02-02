import { Module } from "@nestjs/common";
import { TodoService } from "todo/todo.service";
import { TodoController } from "todo/todo.controller";

@Module({
   controllers: [TodoController],
   providers: [TodoService]
})
export class TodoModule {}
