import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DatabaseService } from "database/database.service";
import { profilesTable, usersTable } from "database/tables";
import { SelectUserSchema } from "utils/schemas";
import { SelectUserDto, UpdateUserDto } from "utils/types";
import { parse } from "valibot";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async findProfile(id: string): Promise<SelectUserDto> {
      const builder = this.dbService.builder;

      const query = builder
         .select({ user: usersTable, profile: profilesTable })
         .from(usersTable)
         .where(eq(usersTable.id, sql.placeholder("id")))
         .innerJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
         .prepare();

      const data = await query.get({ id });

      if (!data) {
         throw new NotFoundException("User not found");
      }

      return parse(SelectUserSchema, { ...data.user, ...data.profile });
   }

   async updateProfile(id: string, updateUserDto: UpdateUserDto) {
      const builder = this.dbService.builder;

      const query = builder
         .update(profilesTable)
         .set({ ...updateUserDto, updatedAt: new Date() })
         .where(eq(profilesTable.userId, sql.placeholder("id")))
         .prepare();

      await query
         .run({ id })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (resultSet && !resultSet.rowsAffected) {
               throw new NotFoundException("List not found");
            }
         });
   }
}
