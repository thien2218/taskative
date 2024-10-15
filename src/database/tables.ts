import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

type Status = {
   name: string;
   rgb: number[];
};

export const usersTable = sqliteTable("users", {
   id: text("id").primaryKey(),
   email: text("email").notNull().unique(),
   emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
   encodedPassword: text("encoded_password"),
   providers: text("providers", { mode: "json" })
      .$type<("email" | "google" | "facebook")[]>()
      .notNull()
      .default(["email"]),
   encodedRefreshToken: text("encoded_refresh_token")
});

export const profilesTable = sqliteTable("profiles", {
   userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
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

export const boardsTable = sqliteTable(
   "boards",
   {
      id: text("id").primaryKey(),
      userId: text("user_id")
         .notNull()
         .references(() => usersTable.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      pipeline: text("pipeline", { mode: "json" })
         .$type<Status[]>()
         .default([
            { name: "hiatus", rgb: [0, 0, 0] },
            { name: "pending", rgb: [0, 0, 0] },
            { name: "on-going", rgb: [0, 0, 0] },
            { name: "completed", rgb: [0, 0, 0] }
         ])
         .notNull(),
      createdAt: integer("created_at", { mode: "timestamp" })
         .notNull()
         .default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" })
         .notNull()
         .default(sql`(unixepoch())`)
   },
   (table) => ({
      boardNameUnique: unique("board_name_unique").on(table.userId, table.name)
   })
);

export const tasksTable = sqliteTable("tasks", {
   id: text("id").primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
   boardId: text("board_id")
      .notNull()
      .references(() => boardsTable.id, { onDelete: "cascade" }),
   listId: text("list_id").references(() => listsTable.id, {
      onDelete: "set null"
   }),
   description: text("description").notNull(),
   status: text("status").notNull(),
   priority: text("priority").notNull(),
   note: text("note"),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
});

export const listsTable = sqliteTable(
   "lists",
   {
      id: text("id").primaryKey(),
      userId: text("user_id")
         .notNull()
         .references(() => usersTable.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      boardId: text("board_id")
         .notNull()
         .references(() => boardsTable.id, { onDelete: "cascade" }),
      description: text("description"),
      createdAt: integer("created_at", { mode: "timestamp" })
         .notNull()
         .default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" })
         .notNull()
         .default(sql`(unixepoch())`)
   },
   (table) => ({
      listNameUnique: unique("list_name_unique").on(table.userId, table.name)
   })
);

export const notesTable = sqliteTable("notes", {
   id: text("id").primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
   content: text("content").notNull(),
   createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
   updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
});
