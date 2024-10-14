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
import { NoteService } from "./note.service";
import { User } from "utils/decorators";
import { NoteContentDto, Page, TUser } from "utils/types";
import { ValibotPipe } from "utils/pipes";
import { NoteContentSchema, PageSchema } from "utils/schemas";

@Controller("note")
export class NoteController {
   constructor(private readonly noteService: NoteService) {}

   @Get()
   async findMany(
      @User() { userId }: TUser,
      @Query(new ValibotPipe(PageSchema)) page: Page
   ) {
      return this.noteService.findMany(userId, page);
   }

   @Get(":id")
   async findOne(@Param("id") id: string, @User() { userId }: TUser) {
      return this.noteService.findOne(id, userId);
   }

   @Post()
   @UsePipes(new ValibotPipe(NoteContentSchema))
   async create(
      @User() { userId }: TUser,
      @Body() { content }: NoteContentDto
   ) {
      return this.noteService.create(userId, content);
   }

   @Patch(":id")
   @UsePipes(new ValibotPipe(NoteContentSchema))
   async update(
      @Param("id") id: string,
      @User() { userId }: TUser,
      @Body() { content }: NoteContentDto
   ) {
      return this.noteService.update(id, userId, content);
   }

   @Delete(":id")
   async delete(@Param("id") id: string, @User() { userId }: TUser) {
      return this.noteService.delete(id, userId);
   }
}
