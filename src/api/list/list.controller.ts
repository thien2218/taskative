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
import {
   ListTaskIDsSchema,
   CreateListSchema,
   PageSchema,
   UpdateListSchema
} from "utils/schemas";

@Controller("list")
export class ListController {
   constructor(private readonly listService: ListService) {}

   @Get()
   async findMany(
      @Query(new ValibotPipe(PageSchema)) page: Page,
      @User() { userId }: TUser
   ) {
      return this.listService.findMany(userId, page);
   }

   @Get(":id")
   async findOne(@Param("id") id: string, @User() { userId }: TUser) {
      return this.listService.findOne(id, userId);
   }

   @Get(":id/tasks")
   async findTasksFromList(@Param("id") id: string, @User() { userId }: TUser) {
      return this.listService.findTasksFromList(id, userId);
   }

   @Post()
   @UsePipes(new ValibotPipe(CreateListSchema))
   async create(
      @Body() createListDto: CreateListDto,
      @User() { userId }: TUser
   ) {
      return this.listService.create(userId, createListDto);
   }

   @Post(":id/tasks")
   @UsePipes(new ValibotPipe(ListTaskIDsSchema))
   async addTasks(
      @Param("id") id: string,
      @Body() tasksToAdd: string[],
      @User() { userId }: TUser
   ) {
      return this.listService.addTasks(id, userId, tasksToAdd);
   }

   @Delete(":id/tasks")
   @UsePipes(new ValibotPipe(ListTaskIDsSchema))
   async removeTasks(
      @Param("id") id: string,
      @Body() tasksToRemove: string[],
      @User() { userId }: TUser
   ) {
      return this.listService.removeTasks(id, userId, tasksToRemove);
   }

   @Patch(":id")
   @UsePipes(new ValibotPipe(UpdateListSchema))
   async update(
      @Param("id") id: string,
      @Body() updateListDto: UpdateListDto,
      @User() { userId }: TUser
   ) {
      return this.listService.update(id, userId, updateListDto);
   }

   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {
      return this.listService.delete(id, userId);
   }
}
