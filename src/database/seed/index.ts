import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import seedUsers from "./users.seed";
import seedBoards from "./lists.seed";
import seedTasks from "./tasks.seed";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const client = createClient({
   url: process.env.TURSO_DATABASE_URL as string,
   authToken: process.env.TURSO_AUTH_TOKEN as string
});

const db = drizzle(client, { logger: true });

export default db;

const main = async () => {
   await seedUsers();
   await seedBoards();
   await seedTasks();
};

main().catch((e) => {
   console.error(e);
   process.exit(0);
});
