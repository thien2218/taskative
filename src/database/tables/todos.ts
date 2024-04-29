import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const todos = sqliteTable("todos", {
   id: text("id").primaryKey(),
   description: text("description").notNull(),
   completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
   userId: text("user_id")
      .notNull()
      .references(() => users.id)
});
