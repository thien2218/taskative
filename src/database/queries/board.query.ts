import { boardsTable } from "database/tables";
import builder from "./";
import { and, eq, sql } from "drizzle-orm";

const boardColumns = {
   name: boardsTable.name,
   description: boardsTable.description,
   pipeline: boardsTable.pipeline,
   createdAt: boardsTable.createdAt,
   updatedAt: boardsTable.updatedAt
};

export const findBoardsQuery = builder
   .select({ ...boardColumns, id: boardsTable.id })
   .from(boardsTable)
   .where(eq(boardsTable.userId, sql.placeholder("userId")))
   .limit(sql.placeholder("limit"))
   .offset(sql.placeholder("offset"))
   .prepare();

export const findBoardQuery = builder
   .select(boardColumns)
   .from(boardsTable)
   .where(
      and(
         eq(boardsTable.id, sql.placeholder("id")),
         eq(boardsTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();

export const getBoardPipelineQuery = builder
   .select({ pipeline: boardsTable.pipeline })
   .from(boardsTable)
   .where(
      and(
         eq(boardsTable.id, sql.placeholder("boardId")),
         eq(boardsTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();

export const deleteBoardQuery = builder
   .delete(boardsTable)
   .where(
      and(
         eq(boardsTable.id, sql.placeholder("id")),
         eq(boardsTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();
