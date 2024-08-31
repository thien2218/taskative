import { nanoid } from "nanoid";
import * as agron2 from "argon2";
import db from ".";
import { profilesTable, usersTable } from "../tables";

type User = {
   id: string;
   email: string;
   encodedPassword: string | null;
   emailVerified: boolean;
};

type Profile = {
   userId: string;
   firstName: string;
   lastName: string;
};

const seedUsers = async () => {
   const users: User[] = [];
   const profiles: Profile[] = [];

   for (let i = 0; i < 10; i++) {
      const emailVerified = i % 2 === 0;
      const hasPassword = i % 4 === 0;
      const id = nanoid(25);

      users.push({
         id,
         email: `user${i}@gmail.com`,
         encodedPassword: hasPassword
            ? await agron2.hash(`password${i}`)
            : null,
         emailVerified
      });

      profiles.push({
         userId: id,
         firstName: `User ${i}`,
         lastName: "Test"
      });
   }

   await db.transaction(async (tx) => {
      await tx.insert(usersTable).values(users).execute();
      await tx.insert(profilesTable).values(profiles).execute();
   });
};

export default seedUsers;
