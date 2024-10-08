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
import { PaginationQueryPipe, ValibotPipe } from "utils/pipes";
import {
   CreateBoardDto,
   PaginationQuery,
   SelectBoardDto,
   SelectTaskDto,
   UpdateBoardDto,
   UserDto
} from "utils/types";
import { User } from "utils/decorators";
import {
   AddToBoardSchema,
   CreateBoardSchema,
   UpdateBoardSchema
} from "utils/schemas";

@Controller("board")
export class BoardController {
   constructor(private readonly listService: BoardService) {}

   @Get()
   async findMany(
      @Query(PaginationQueryPipe) page: PaginationQuery,
      @User() { userId }: UserDto
   ): Promise<SelectBoardDto[]> {
      return this.listService.findMany(userId, page);
   }

   @Get(":id")
   async findOne(
      @Param("id") id: string,
      @User() { userId }: UserDto
   ): Promise<SelectBoardDto> {
      return this.listService.findOne(id, userId);
   }

   @Get(":id/tasks")
   async findTasks(
      @Param("id") id: string,
      @User() { userId }: UserDto
   ): Promise<SelectTaskDto[]> {
      return this.listService.findTasks(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateBoardSchema))
   @Post()
   async create(
      @User() { userId }: UserDto,
      @Body() createBoardDto: CreateBoardDto
   ) {
      return this.listService.create(userId, createBoardDto);
   }

   @UsePipes(new ValibotPipe(AddToBoardSchema))
   @Post(":id/tasks")
   async addToBoard(
      @Param("id") id: string,
      @User() { userId }: UserDto,
      @Body() { taskIds }: { taskIds: string[] }
   ): Promise<{ totalAddedTasks: number }> {
      return this.listService.addToBoard(id, userId, taskIds);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateBoardSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @User() { userId }: UserDto,
      @Body() updateBoardDto: UpdateBoardDto
   ) {
      return this.listService.update(id, userId, updateBoardDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: UserDto) {
      return this.listService.delete(id, userId);
   }
}
