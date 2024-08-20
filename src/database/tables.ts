import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Users table
 */
export const users = sqliteTable("users", {
   id: text("id").primaryKey(),
   email: text("email").notNull().unique(),
   emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
   encryptedPassword: text("encrypted_password"),
   firstName: text("first_name").notNull(),
   lastName: text("last_name").notNull(),
   profileImage: text("profile_image"),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   provider: text("provider").notNull().default("email")
});
