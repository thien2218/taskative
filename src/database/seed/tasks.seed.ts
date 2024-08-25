import { nanoid } from "nanoid";
import db from ".";
import { tasksTable, usersTable } from "../tables";

const seed = async () => {
   const users = await db.select().from(usersTable).all();

   if (!users.length) {
      throw new Error("Users table is empty");
   }

   let userId;

   const data = [];

   for (let i = 0; i < 30; i++) {
      userId = users[Math.floor(Math.random() * users.length)].id;

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
