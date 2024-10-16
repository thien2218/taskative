import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "database/database.service";
import { profilesTable } from "database/tables";
import { UpdateUserDto } from "utils/types";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async findProfile(id: string) {
      const query = this.dbService.prepared.findUserProfileQuery;

      const profile = await query.get({ id });

      if (!profile) {
         throw new NotFoundException("User not found");
      }

      return profile;
   }

   async updateProfile(id: string, updateUserDto: UpdateUserDto) {
      const query = this.dbService.builder
         .update(profilesTable)
         .set({ ...updateUserDto, updatedAt: new Date() })
         .where(eq(profilesTable.userId, id));

      await query
         .run()
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("Board not found");
            }
         });
   }
}
