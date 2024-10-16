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
   UsePipes
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { ValibotPipe } from "utils/pipes";
import { CreateTaskDto, Page, UpdateTaskDto, TUser } from "utils/types";
import { User } from "utils/decorators";
import { CreateTaskSchema, PageSchema, UpdateTaskSchema } from "utils/schemas";

@Controller("board/:boardId/task")
export class TaskController {
   constructor(private readonly taskService: TaskService) {}

   @Get()
   async findMany(
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Query(new ValibotPipe(PageSchema)) page: Page
   ) {
      return this.taskService.findMany(boardId, userId, page);
   }

   @Get(":id")
   async findOne(@Param("id") id: string, @User() { userId }: TUser) {
      return this.taskService.findOne(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateTaskSchema))
   @Post()
   async create(
      @Param("boardId") boardId: string,
      @Body() createTaskDto: CreateTaskDto,
      @User() { userId }: TUser
   ) {
      return this.taskService.create(boardId, userId, createTaskDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateTaskSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @Body() updateTaskDto: UpdateTaskDto,
      @User() { userId }: TUser
   ) {
      return this.taskService.update(id, boardId, userId, updateTaskDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {
      return this.taskService.delete(id, userId);
   }
}
