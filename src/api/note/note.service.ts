import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "database/database.service";
import { notesTable } from "database/tables";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Page } from "utils/types";

@Injectable()
export class NoteService {
   private readonly noteColumns = {
      id: notesTable.id,
      content: notesTable.content,
      createdAt: notesTable.createdAt,
      updatedAt: notesTable.updatedAt
   };

   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: Page) {
      const query = this.dbService.builder
         .select(this.noteColumns)
         .from(notesTable)
         .where(eq(notesTable.userId, sql.placeholder("userId")))
         .orderBy(notesTable.updatedAt)
         .limit(sql.placeholder("limit"))
         .offset(sql.placeholder("offset"))
         .prepare();

      const notes = await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!notes || notes.length === 0) {
         throw new NotFoundException("No notes found");
      }

      return notes;
   }

   async findOne(id: string, userId: string) {
      const query = this.dbService.builder
         .select(this.noteColumns)
         .from(notesTable)
         .where(
            and(
               eq(notesTable.id, sql.placeholder("id")),
               eq(notesTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      const note = await query
         .get({ id, userId })
         .catch(this.dbService.handleDbError);

      if (!note) {
         throw new NotFoundException("Note not found");
      }

      return note;
   }

   async create(userId: string, content: string) {
      const query = this.dbService.builder
         .insert(notesTable)
         .values({
            id: sql.placeholder("id"),
            userId: sql.placeholder("userId"),
            content: sql.placeholder("content")
         })
         .prepare();

      const id = nanoid(25);

      await query
         .run({ id, userId, content })
         .catch(this.dbService.handleDbError);

      return { message: "Note created successfully", id };
   }

   async update(id: string, userId: string, content: string) {
      const query = this.dbService.builder
         .update(notesTable)
         .set({ content })
         .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));

      await query
         .run()
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("List not found");
            }
         });
   }

   async delete(id: string, userId: string) {
      const query = this.dbService.builder
         .delete(notesTable)
         .where(
            and(
               eq(notesTable.id, sql.placeholder("id")),
               eq(notesTable.userId, sql.placeholder("userId"))
            )
         )
         .prepare();

      await query
         .run({ id, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("List not found");
            }
         });
   }
}
