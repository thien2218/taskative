import { profilesTable, usersTable } from "database/tables";
import builder from "./";
import { eq, sql } from "drizzle-orm";

export const findUserProfileQuery = builder
   .select({
      email: usersTable.email,
      firstName: profilesTable.firstName,
      lastName: profilesTable.lastName,
      profileImage: profilesTable.profileImage,
      createdAt: profilesTable.createdAt,
      updatedAt: profilesTable.updatedAt
   })
   .from(usersTable)
   .where(eq(usersTable.id, sql.placeholder("id")))
   .innerJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
   .prepare();
