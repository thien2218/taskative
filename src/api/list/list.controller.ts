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

@Controller("board/:boardId/list")
export class ListController {
   constructor(private readonly listService: ListService) {}

   @Get()
   async findMany(
      @Param("boardId") boardId: string,
      @Query(new ValibotPipe(PageSchema)) page: Page,
      @User() { userId }: TUser
   ) {
      return this.listService.findMany(boardId, userId, page);
   }

   @Get(":id")
   async findOne(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser
   ) {
      return this.listService.findOne(id, boardId, userId);
   }

   @Get(":id/tasks")
   async findTasksFromList(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Query(new ValibotPipe(PageSchema)) page: Page
   ) {
      return this.listService.findTasksFromList(id, boardId, userId, page);
   }

   @Post()
   @UsePipes(new ValibotPipe(CreateListSchema))
   async create(
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Body() createListDto: CreateListDto
   ) {
      return this.listService.create(boardId, userId, createListDto);
   }

   @Post(":id/tasks")
   @UsePipes(new ValibotPipe(ListTaskIDsSchema))
   async addTasks(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Body() tasksToAdd: string[]
   ) {
      return this.listService.addTasks(id, boardId, userId, tasksToAdd);
   }

   @Delete(":id/tasks")
   @UsePipes(new ValibotPipe(ListTaskIDsSchema))
   async removeTasks(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Body() tasksToRemove: string[]
   ) {
      return this.listService.removeTasks(id, boardId, userId, tasksToRemove);
   }

   @Patch(":id")
   @UsePipes(new ValibotPipe(UpdateListSchema))
   async update(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser,
      @Body() updateListDto: UpdateListDto
   ) {
      return this.listService.update(id, boardId, userId, updateListDto);
   }

   @Delete(":id")
   async delete(
      @Param("id") id: string,
      @Param("boardId") boardId: string,
      @User() { userId }: TUser
   ) {
      return this.listService.delete(id, boardId, userId);
   }
}
