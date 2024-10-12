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
import { BoardService } from "./board.service";
import { ValibotPipe } from "utils/pipes";
import { CreateBoardDto, Page, UpdateBoardDto, TUser } from "utils/types";
import { User } from "utils/decorators";
import {
   AddToBoardSchema,
   CreateBoardSchema,
   PageSchema,
   UpdateBoardSchema
} from "utils/schemas";

@Controller("board")
export class BoardController {
   constructor(private readonly listService: BoardService) {}

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
   async findTasks(@Param("id") id: string, @User() { userId }: TUser) {
      return this.listService.findTasks(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateBoardSchema))
   @Post()
   async create(
      @User() { userId }: TUser,
      @Body() createBoardDto: CreateBoardDto
   ) {
      return this.listService.create(userId, createBoardDto);
   }

   @UsePipes(new ValibotPipe(AddToBoardSchema))
   @Post(":id/tasks")
   async addToBoard(
      @Param("id") id: string,
      @User() { userId }: TUser,
      @Body() { taskIds }: { taskIds: string[] }
   ): Promise<{ message: string; tasksAdded: string[] }> {
      return this.listService.addToBoard(id, userId, taskIds);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateBoardSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @User() { userId }: TUser,
      @Body() updateBoardDto: UpdateBoardDto
   ) {
      return this.listService.update(id, userId, updateBoardDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {
      return this.listService.delete(id, userId);
   }
}
