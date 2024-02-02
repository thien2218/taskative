import { Controller, Get, Post, Delete, Put } from "@nestjs/common";
import { TodoService } from "todo/todo.service";

@Controller("todo")
export class TodoController {
   constructor(private readonly todoService: TodoService) {}

   @Post()
   create() {}

   @Get()
   findAll() {}

   @Get(":id")
   findOne() {}

   @Put(":id")
   update() {}

   @Delete(":id")
   delete() {}
}
