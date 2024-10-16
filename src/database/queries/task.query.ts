import { tasksTable } from "database/tables";
import builder from "./";
import { and, eq, sql, SQLWrapper } from "drizzle-orm";

const taskColumns = {
   id: tasksTable.id,
   description: tasksTable.description,
   status: tasksTable.status,
   priority: tasksTable.priority,
   createdAt: tasksTable.createdAt,
   updatedAt: tasksTable.updatedAt
};

export const findTasksQueryConstructor = (conditions: SQLWrapper[]) => {
   return builder
      .select(taskColumns)
      .from(tasksTable)
      .where(
         and(
            eq(tasksTable.boardId, sql.placeholder("boardId")),
            eq(tasksTable.userId, sql.placeholder("userId")),
            ...conditions
         )
      )
      .limit(sql.placeholder("limit"))
      .offset(sql.placeholder("offset"))
      .prepare();
};

export const findTasksQuery = findTasksQueryConstructor([]);

export const findTaskQuery = builder
   .select(taskColumns)
   .from(tasksTable)
   .where(
      and(
         eq(tasksTable.id, sql.placeholder("id")),
         eq(tasksTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();

export const deleteTaskQuery = builder
   .delete(tasksTable)
   .where(
      and(
         eq(tasksTable.id, sql.placeholder("id")),
         eq(tasksTable.userId, sql.placeholder("userId"))
      )
   )
   .prepare();
