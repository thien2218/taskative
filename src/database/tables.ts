import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
   id: text("id").primaryKey(),
   email: text("email").notNull().unique(),
   emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
   encryptedPassword: text("encrypted_password"),
   provider: text("provider").notNull().default("email"),
   refreshToken: text("refresh_token")
});

export const profilesTable = sqliteTable("profiles", {
   userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => usersTable.id),
   firstName: text("first_name").notNull(),
   lastName: text("last_name").notNull(),
   profileImage: text("profile_image"),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
});

export const listsTable = sqliteTable("lists", {
   id: text("id").primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => usersTable.id),
   name: text("name").notNull(),
   description: text("description"),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
});

export const tasksTable = sqliteTable("tasks", {
   id: text("id").primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => usersTable.id),
   listId: text("list_id").references(() => listsTable.id),
   description: text("description").notNull(),
   status: text("status").notNull().default("pending"),
   priority: text("priority").notNull(),
   steps: text("steps", { mode: "json" }).$type<string[]>(),
   note: text("note"),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
});
