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
import { PaginationQueryPipe, ValibotPipe } from "utils/pipes";
import {
   CreateTaskDto,
   PaginationQuery,
   SelectTaskDto,
   UpdateTaskDto,
   UserDto
} from "utils/types";
import { User } from "utils/decorators";
import { CreateTaskSchema, UpdateTaskSchema } from "utils/schemas";

@Controller("task")
export class TaskController {
   constructor(private readonly taskService: TaskService) {}

   @Get()
   async findMany(
      @Query(PaginationQueryPipe) pagination: PaginationQuery,
      @User() { userId }: UserDto
   ): Promise<SelectTaskDto[]> {
      return this.taskService.findMany(userId, pagination);
   }

   @Get(":id")
   async findOne(
      @Param("id") id: string,
      @User() { userId }: UserDto
   ): Promise<SelectTaskDto> {
      return this.taskService.findOne(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateTaskSchema))
   @Post()
   async create(
      @Body() createTaskDto: CreateTaskDto,
      @User() { userId }: UserDto
   ) {
      return this.taskService.create(userId, createTaskDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateTaskSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @Body() updateTaskDto: UpdateTaskDto,
      @User() { userId }: UserDto
   ) {
      return this.taskService.update(id, userId, updateTaskDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: UserDto) {
      return this.taskService.delete(id, userId);
   }
}
