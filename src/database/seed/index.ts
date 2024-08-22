import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const client = createClient({
   url: process.env.TURSO_DATABASE_URL as string,
   authToken: process.env.TURSO_AUTH_TOKEN as string
});

const db = drizzle(client, { logger: true });

export default db;
