import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Users table
 */
export const users = sqliteTable("users", {
   id: text("id").primaryKey(),
   username: text("username").notNull().unique(),
   email: text("email").notNull().unique(),
   encryptedPassword: text("encrypted_password"),
   firstName: text("first_name").notNull(),
   lastName: text("last_name").notNull(),
   profilePicture: text("profile_picture"),
   createdAt: integer("created_at", { mode: "timestamp" }).notNull()
});
