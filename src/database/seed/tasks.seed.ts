import { nanoid } from "nanoid";
import db from ".";
import { boardsTable, tasksTable, usersTable } from "../tables";

const seedTasks = async () => {
   const userIds = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .all();

   const boardIds = await db
      .select({ id: boardsTable.id })
      .from(boardsTable)
      .all();

   if (!userIds.length) {
      throw new Error("Users table is empty");
   }
   if (!boardIds.length) {
      throw new Error("Boards table is empty");
   }

   const tasks = [];

   for (let i = 0; i < 30; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)].id;
      const boardId =
         i % 6 === 0
            ? null
            : boardIds[Math.floor(Math.random() * boardIds.length)].id;

      tasks.push({
         id: nanoid(25),
         userId,
         boardId,
         description: `Task ${i}`,
         priority: "optional"
      });
   }

   await db.insert(tasksTable).values(tasks).execute();
};

export default seedTasks;
