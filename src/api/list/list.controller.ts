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
import { ListService } from "./list.service";
import { PaginationQueryPipe, ValibotPipe } from "src/utils/pipes";
import {
   CreateListDto,
   PaginationQuery,
   SelectListDto,
   SelectTaskDto,
   UpdateListDto,
   UserDto
} from "src/utils/types";
import { User } from "src/utils/decorators";
import {
   AddToListSchema,
   CreateListSchema,
   UpdateListSchema
} from "src/utils/schemas";

@Controller("list")
export class ListController {
   constructor(private readonly listService: ListService) {}

   @Get()
   async findMany(
      @Query(PaginationQueryPipe) page: PaginationQuery,
      @User() { userId }: UserDto
   ): Promise<SelectListDto[]> {
      return this.listService.findMany(userId, page);
   }

   @Get(":id")
   async findOne(
      @Param("id") id: string,
      @User() { userId }: UserDto
   ): Promise<SelectListDto> {
      return this.listService.findOne(id, userId);
   }

   @Get(":id/tasks")
   async findTasks(
      @Param("id") id: string,
      @User() { userId }: UserDto
   ): Promise<SelectTaskDto[]> {
      return this.listService.findTasks(id, userId);
   }

   @UsePipes(new ValibotPipe(CreateListSchema))
   @Post()
   async create(
      @User() { userId }: UserDto,
      @Body() createListDto: CreateListDto
   ) {
      return this.listService.create(userId, createListDto);
   }

   @UsePipes(new ValibotPipe(AddToListSchema))
   @Post(":id/tasks")
   async addToList(
      @Param("id") id: string,
      @User() { userId }: UserDto,
      @Body() { taskIds }: { taskIds: string[] }
   ): Promise<{ totalAddedTasks: number }> {
      return this.listService.addToList(id, userId, taskIds);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateListSchema))
   @Patch(":id")
   async update(
      @Param("id") id: string,
      @User() { userId }: UserDto,
      @Body() updateListDto: UpdateListDto
   ) {
      return this.listService.update(id, userId, updateListDto);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: UserDto) {
      return this.listService.delete(id, userId);
   }
}
