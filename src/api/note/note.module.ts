import { Module } from "@nestjs/common";
import { NoteController } from "./note.controller";
import { NoteService } from "./note.service";
import { DatabaseService } from "database/database.service";

@Module({
   controllers: [NoteController],
   providers: [NoteService, DatabaseService]
})
export class NoteModule {}
