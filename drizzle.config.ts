import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export default defineConfig({
   schema: "database/tables.ts",
   out: "database/migrations",
   dialect: "sqlite",
   driver: "turso",
   dbCredentials: {
      url: process.env.TURSO_DATABASE_URL as string,
      authToken: process.env.TURSO_AUTH_TOKEN
   },
   verbose: true,
   strict: true
});
