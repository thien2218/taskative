import { Module } from "@nestjs/common";
import { TodoService } from "@/api/todo/todo.service";
import { TodoController } from "@/api/todo/todo.controller";
import { DatabaseModule } from "@/database/database.module";

@Module({
   imports: [DatabaseModule],
   controllers: [TodoController],
   providers: [TodoService]
})
export class TodoModule {}
