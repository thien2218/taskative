import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DatabaseService } from "database/database.service";
import { profilesTable, usersTable } from "database/tables";
import { UpdateUserDto } from "utils/types";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async findProfile(id: string) {
      const builder = this.dbService.builder;

      const query = builder
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

      const user = await query.get({ id });

      if (!user) {
         throw new NotFoundException("User not found");
      }

      return user;
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
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }
}
