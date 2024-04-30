import { ValibotPipe } from "@/tools/pipes/valibot.pipe";
import {
   CreateTodoDto,
   CreateTodoSchema,
   SelectTodoDto,
   UpdateTodoDto
} from "@/tools/schemas/todo.schema";
import {
   Body,
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus,
   Param,
   Patch,
   Post,
   Query,
   UseGuards,
   UsePipes
} from "@nestjs/common";
import { TodoService } from "./todo.service";
import { AccessGuard } from "../auth/guards/access.guard";
import { User } from "@/tools/decorators/user.decorator";
import { SelectUserDto } from "@/tools/types/user.type";
import { ParseNonNegativePipe } from "@/tools/pipes/non-negative.pipe";
import { ParseLimitPipe } from "@/tools/pipes/limit.pipe";

@Controller("todo")
export class TodoController {
   constructor(private readonly todoService: TodoService) {}
   @Post()
   @HttpCode(HttpStatus.CREATED)
   @UseGuards(AccessGuard)
   @UsePipes(new ValibotPipe(CreateTodoSchema))
   create(
      @User() { id }: SelectUserDto,
      @Body() createTodoDto: CreateTodoDto
   ): Promise<SelectTodoDto> {
      return this.todoService.create(id, createTodoDto);
   }

   @Get()
   @UseGuards(AccessGuard)
   findMany(
      @Query("page", ParseNonNegativePipe) page: number,
      @Query("limit", ParseLimitPipe) limit: number,
      @User() { id }: SelectUserDto
   ): Promise<SelectTodoDto[]> {
      return this.todoService.findMany(id, page, limit);
   }

   @Get(":id")
   @UseGuards(AccessGuard)
   findOne(
      @Param("id") id: string,
      @User() { id: userId }: SelectUserDto
   ): Promise<SelectTodoDto> {
      return this.todoService.findOne(id, userId);
   }

   @Patch(":id")
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(AccessGuard)
   update(
      @Param("id") id: string,
      @User() { id: userId }: SelectUserDto,
      @Body() updateTodoDto: UpdateTodoDto
   ) {
      return this.todoService.update(id, userId, updateTodoDto);
   }

   @Delete(":id")
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(AccessGuard)
   delete(@Param("id") id: string, @User() { id: userId }: SelectUserDto) {
      return this.todoService.delete(id, userId);
   }
}
