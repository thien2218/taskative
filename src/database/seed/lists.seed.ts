import { listsTable, usersTable } from "../tables";
import db from ".";
import { nanoid } from "nanoid";

const seedLists = async () => {
   const userIds = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .all();

   if (!userIds.length) {
      throw new Error("Users table is empty");
   }

   const lists = [];

   for (let i = 0; i < 30; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)].id;

      lists.push({
         id: nanoid(25),
         userId,
         name: `List ${i}`,
         description: `Description for list ${i}`
      });
   }

   await db.insert(listsTable).values(lists).execute();
};

export default seedLists;
