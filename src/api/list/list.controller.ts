import {
   Body,
   Controller,
   Delete,
   Get,
   Param,
   Patch,
   Post,
   Query,
   UsePipes
} from "@nestjs/common";
import { ListService } from "./list.service";
import { ValibotPipe } from "utils/pipes";
import { CreateListDto, Page, TUser, UpdateListDto } from "utils/types";
import { User } from "utils/decorators";
import { CreateListSchema, PageSchema, UpdateListSchema } from "utils/schemas";

@Controller("list")
export class ListController {
   constructor(private readonly listService: ListService) {}

   @Get()
   async findMany(
      @Query(new ValibotPipe(PageSchema)) pagination: Page,
      @User() { userId }: TUser
   ) {}

   @Get(":id")
   async findOne(@Param("id") id: string, @User() { userId }: TUser) {}

   @Get(":id/tasks")
   async findTasks(@Param("id") id: string, @User() { userId }: TUser) {}

   @Post()
   @UsePipes(new ValibotPipe(CreateListSchema))
   async create(
      @Body() createListDto: CreateListDto,
      @User() { userId }: TUser
   ) {}

   @Post(":id/tasks")
   @UsePipes(new ValibotPipe(CreateListSchema))
   async addTask(
      @Body() addTasksToListDto: string[],
      @User() { userId }: TUser
   ) {}

   @Patch(":id")
   @UsePipes(new ValibotPipe(UpdateListSchema))
   async update(
      @Body() updateListDto: UpdateListDto,
      @User() { userId }: TUser
   ) {}

   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {}
}
