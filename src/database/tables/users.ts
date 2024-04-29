import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
   id: text("id").primaryKey(),
   email: text("email").unique().notNull(),
   emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
   username: text("username").unique().notNull(),
   passwordHash: text("password_hash"),
   createdAt: integer("created_at").notNull(),
   provider: text("provider", {
      enum: ["local", "google", "facebook"]
   }).notNull(),
   providerId: text("provider_id"),
   refreshToken: text("refresh_token"),
   profileImage: text("profile_image")
});
