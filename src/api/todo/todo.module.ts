import { Module } from "@nestjs/common";
import { TodoService } from "@/api/todo/todo.service";
import { TodoController } from "@/api/todo/todo.controller";
import { DatabaseModule } from "@/database/database.module";
import { AccessStrategy } from "../auth/stategies/access.strategy";

@Module({
   imports: [DatabaseModule],
   controllers: [TodoController],
   providers: [TodoService, AccessStrategy]
})
export class TodoModule {}
