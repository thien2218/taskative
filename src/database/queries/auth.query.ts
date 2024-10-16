import { profilesTable, usersTable } from "database/tables";
import { eq, sql } from "drizzle-orm";
import builder from "./";

export const getUserByEmailQuery = builder
   .select({
      id: usersTable.id,
      encodedPassword: usersTable.encodedPassword,
      profileImage: profilesTable.profileImage,
      firstName: profilesTable.firstName,
      lastName: profilesTable.lastName
   })
   .from(usersTable)
   .where(eq(usersTable.email, sql.placeholder("email")))
   .innerJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
   .prepare();

export const logUserOutQuery = builder
   .update(usersTable)
   .set({ encodedRefreshToken: null })
   .where(eq(usersTable.id, sql.placeholder("id")))
   .prepare();

export const getUserRefreshTokenQuery = builder
   .select({ encodedRefreshToken: usersTable.encodedRefreshToken })
   .from(usersTable)
   .where(eq(usersTable.id, sql.placeholder("id")))
   .prepare();

export const validateOAuthUserQuery = builder
   .select({
      id: usersTable.id,
      emailVerified: usersTable.emailVerified,
      providers: usersTable.providers
   })
   .from(usersTable)
   .where(eq(usersTable.email, sql.placeholder("email")))
   .prepare();
