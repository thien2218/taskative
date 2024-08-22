import { nanoid } from "nanoid";
import db from ".";
import { tasks, users } from "../tables";

const seed = async () => {
   const usersList = await db.select().from(users).all();

   if (!usersList.length) {
      throw new Error("Users table is empty");
   }

   const userId = usersList[Math.floor(Math.random() * usersList.length)].id;

   const data = Array(30)
      .fill(0)
      .map((_, index) => ({
         id: nanoid(25),
         userId,
         description: `Task ${index}`,
         priority: "optional"
      }));

   await db.insert(tasks).values(data).execute();
};

seed().catch((e) => {
   console.error(e);
   process.exit(0);
});
