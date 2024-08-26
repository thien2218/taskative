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
import { PaginationQueryPipe, ValibotPipe } from "src/utils/pipes";
import {
   AddToListDto,
   CreateTaskDto,
   PaginationQuery,
   SelectTaskDto,
   UpdateTaskDto,
   UserDto
} from "src/utils/types";
import { User } from "src/utils/decorators";
import {
   AddToListSchema,
   CreateTaskSchema,
   UpdateTaskSchema
} from "src/utils/schemas";

@Controller("task")
export class TaskController {
   constructor(private readonly taskService: TaskService) {}

   @Get()
   async findMany(
      @Query(PaginationQueryPipe) pagination: PaginationQuery,
      @User() { userId }: UserDto
   ): Promise<SelectTaskDto[]> {
      return this.taskService.findMany(pagination, userId);
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

   @UsePipes(new ValibotPipe(AddToListSchema))
   @Post()
   async addToList(
      @Body() addListDto: AddToListDto,
      @User() { userId }: UserDto
   ): Promise<{ totalAddedTasks: number }> {
      return this.taskService.addToList(userId, addListDto);
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
