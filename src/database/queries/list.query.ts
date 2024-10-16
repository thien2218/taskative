import { listsTable, tasksTable } from "database/tables";
import builder, { findTasksQueryConstructor } from "./";
import { and, eq, inArray, sql } from "drizzle-orm";

const listColumns = {
   id: listsTable.id,
   name: listsTable.name,
   description: listsTable.description,
   createdAt: listsTable.createdAt,
   updatedAt: listsTable.updatedAt
};

export const findListsQuery = builder
   .select(listColumns)
   .from(listsTable)
   .where(
      and(
         eq(listsTable.boardId, sql.placeholder("boardId")),
         eq(listsTable.userId, sql.placeholder("userId"))
      )
   )
   .limit(sql.placeholder("limit"))
   .offset(sql.placeholder("offset"))
   .prepare();

export const findListQuery = builder
   .select(listColumns)
   .from(listsTable)
   .where(
      and(
         eq(listsTable.id, sql.placeholder("id")),
         eq(listsTable.boardId, sql.placeholder("boardId")),
         eq(listsTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();

export const findTasksFromListQuery = findTasksQueryConstructor([
   eq(tasksTable.listId, sql.placeholder("id"))
]);

export const removeTasksFromListQuery = builder
   .update(tasksTable)
   .set({ listId: null })
   .where(
      and(
         eq(tasksTable.listId, sql.placeholder("id")),
         eq(tasksTable.boardId, sql.placeholder("boardId")),
         eq(tasksTable.userId, sql.placeholder("userId")),
         inArray(tasksTable.id, sql`(${sql.placeholder("tasksToRemove")})`)
      )
   )
   .returning({ id: tasksTable.id })
   .prepare();

export const deleteListQuery = builder
   .delete(listsTable)
   .where(
      and(
         eq(listsTable.id, sql.placeholder("id")),
         eq(listsTable.boardId, sql.placeholder("boardId")),
         eq(listsTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();
