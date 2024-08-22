import { nanoid } from "nanoid";
import * as agron2 from "argon2";
import db from ".";
import { users } from "../tables";

const seed = async () => {
   const data = [];

   for (let i = 0; i < 10; i++) {
      data.push({
         id: nanoid(25),
         lastName: "Test",
         firstName: `User ${i}`,
         email: `user${i}@gmail.com`,
         encryptedPassword: await agron2.hash(`password${i}`)
      });
   }

   await db.insert(users).values(data).execute();
};

seed().catch((e) => {
   console.error(e);
   process.exit(0);
});
