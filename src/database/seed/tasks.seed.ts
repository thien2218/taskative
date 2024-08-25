import { nanoid } from "nanoid";
import db from ".";
import { tasksTable, usersTable } from "../tables";

const seed = async () => {
   const usersList = await db.select().from(usersTable).all();

   if (!usersList.length) {
      throw new Error("Users table is empty");
   }

   let userId;

   const data = [];

   for (let i = 0; i < 30; i++) {
      userId = usersList[Math.floor(Math.random() * usersList.length)].id;

      data.push({
         id: nanoid(25),
         userId,
         description: `Task ${i}`,
         priority: "optional"
      });
   }

   await db.insert(tasksTable).values(data).execute();
};

seed().catch((e) => {
   console.error(e);
   process.exit(0);
});
