import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { boardsTable } from "database/tables";
import { CreateBoardDto, Page, UpdateBoardDto } from "utils/types";

@Injectable()
export class BoardService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(userId: string, page: Page) {
      const query = this.dbService.prepared.findBoardsQuery;

      const boards = await query
         .all({ userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!boards || !boards.length) {
         throw new NotFoundException("No boards found");
      }

      return boards;
   }

   async findOne(id: string, userId: string) {
      const query = this.dbService.prepared.findBoardQuery;

      const board = await query.get({ id, userId });

      if (!board) {
         throw new NotFoundException("Board not found");
      }

      return board;
   }

   async create(userId: string, createBoardDto: CreateBoardDto) {
      const id = nanoid(25);

      const query = this.dbService.builder
         .insert(boardsTable)
         .values({ id, userId, ...createBoardDto });

      await query.run().catch(this.dbService.handleDbError);

      return { message: "Board created successfully", id };
   }

   async update(id: string, userId: string, updateBoardDto: UpdateBoardDto) {
      const query = this.dbService.builder
         .update(boardsTable)
         .set({ ...updateBoardDto, updatedAt: new Date() })
         .where(and(eq(boardsTable.id, id), eq(boardsTable.userId, userId)))
         .prepare();

      await query
         .run()
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }

   async delete(id: string, userId: string) {
      const query = this.dbService.prepared.deleteBoardQuery;

      await query
         .run({ id, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }
}
