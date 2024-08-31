import { nanoid } from "nanoid";
import db from ".";
import { listsTable, tasksTable, usersTable } from "../tables";

const seedTasks = async () => {
   const userIds = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .all();

   const listIds = await db
      .select({ id: listsTable.id })
      .from(listsTable)
      .all();

   if (!userIds.length) {
      throw new Error("Users table is empty");
   }
   if (!listIds.length) {
      throw new Error("Lists table is empty");
   }

   const tasks = [];

   for (let i = 0; i < 30; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)].id;
      const listId =
         i % 6 === 0
            ? null
            : listIds[Math.floor(Math.random() * listIds.length)].id;

      tasks.push({
         id: nanoid(25),
         userId,
         listId,
         description: `Task ${i}`,
         priority: "optional"
      });
   }

   await db.insert(tasksTable).values(tasks).execute();
};

export default seedTasks;
