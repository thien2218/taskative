import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DatabaseService } from "src/database/database.service";
import { profilesTable, usersTable } from "src/database/tables";
import { SelectUserSchema } from "src/utils/schemas";
import { SelectUserDto, UpdateUserDto } from "src/utils/types";
import { parse } from "valibot";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async findOne(id: string): Promise<SelectUserDto> {
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

   async update(id: string, updateUserDto: UpdateUserDto) {
      const builder = this.dbService.builder;

      const query = builder
         .update(profilesTable)
         .set({ ...updateUserDto, updatedAt: new Date() })
         .where(eq(profilesTable.userId, sql.placeholder("id")))
         .prepare();

      await query.run({ id });
   }
}
