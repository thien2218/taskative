import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const client = createClient({
   url: process.env.TURSO_DATABASE_URL as string,
   authToken: process.env.TURSO_AUTH_TOKEN as string
});

const builder = drizzle(client, { logger: true });

export default builder;
export * from "./auth.query";
export * from "./board.query";
export * from "./task.query";
export * from "./user.query";
export * from "./list.query";
