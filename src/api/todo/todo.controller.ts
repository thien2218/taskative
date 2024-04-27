import { ValibotPipe } from "@/tools/pipes/valibot.pipe";
import {
   CreateTodo,
   CreateTodoSchema,
   SelectTodo
} from "@/tools/schemas/todo.schema";
import {
   Controller,
   Get,
   Post,
   Delete,
   Patch,
   UsePipes,
   Body,
   Param,
   HttpCode,
   HttpStatus,
   Query,
   ParseIntPipe
} from "@nestjs/common";
import { TodoService } from "@/api/todo/todo.service";
import { UpdateTodo } from "@/tools/schemas/todo.schema";
import { ParseLimitPipe } from "@/tools/pipes/limit.pipe";

@Controller("todo")
export class TodoController {
   constructor(private readonly todoService: TodoService) {}

   @Post()
   @HttpCode(HttpStatus.CREATED)
   @UsePipes(new ValibotPipe(CreateTodoSchema))
   create(@Body() createTodoDto: CreateTodo): Promise<SelectTodo> {
      return this.todoService.create(createTodoDto);
   }

   @Get()
   findMany(
      @Query("page", ParseIntPipe) page: number,
      @Query("limit", ParseLimitPipe) limit: number
   ): Promise<SelectTodo[]> {
      return this.todoService.findMany(page, limit);
   }

   @Get(":id")
   findOne(@Param("id") id: string): Promise<SelectTodo> {
      return this.todoService.findOne(id);
   }

   @Patch(":id")
   update(
      @Param("id") id: string,
      @Body() updateTodoDto: UpdateTodo
   ): Promise<SelectTodo> {
      return this.todoService.update(id, updateTodoDto);
   }

   @Delete(":id")
   @HttpCode(HttpStatus.NO_CONTENT)
   delete(@Param("id") id: string): void {
      return this.todoService.delete(id);
   }
}
