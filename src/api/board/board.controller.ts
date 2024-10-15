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
   BoardTaskIDsSchema,
   CreateBoardSchema,
   PageSchema,
   UpdateBoardSchema
} from "utils/schemas";

@Controller("board")
export class BoardController {
   constructor(private readonly boardService: BoardService) {}

   @Get()
   async findMany(
      @Query(new ValibotPipe(PageSchema)) page: Page,
      @User() { userId }: TUser
   ) {
      return this.boardService.findMany(userId, page);
   }

   @Get(":id")
   async findOne(@Param("id") id: string, @User() { userId }: TUser) {
      return this.boardService.findOne(id, userId);
   }

   @Get(":id/tasks")
   async findTasksFromBoard(
      @Param("id") id: string,
      @User() { userId }: TUser
   ) {
      return this.boardService.findTasksFromBoard(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateBoardSchema))
   @Post()
   async create(
      @User() { userId }: TUser,
      @Body() createBoardDto: CreateBoardDto
   ) {
      return this.boardService.create(userId, createBoardDto);
   }

   @UsePipes(new ValibotPipe(BoardTaskIDsSchema))
   @Post(":id/tasks")
   async addTasksToBoard(
      @Param("id") id: string,
      @User() { userId }: TUser,
      @Body() taskIds: string[]
   ): Promise<{ message: string; tasksAdded: string[] }> {
      return this.boardService.addTasksToBoard(id, userId, taskIds);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateBoardSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @User() { userId }: TUser,
      @Body() updateBoardDto: UpdateBoardDto
   ) {
      return this.boardService.update(id, userId, updateBoardDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {
      return this.boardService.delete(id, userId);
   }
}
