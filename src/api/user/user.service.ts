import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DatabaseService } from "src/database/database.service";
import { usersTable } from "src/database/tables";
import { SelectUserSchema } from "src/utils/schemas";
import { SelectUserDto, UpdateUserDto } from "src/utils/types";
import { parse } from "valibot";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async getUserInfo(id: string): Promise<SelectUserDto> {
      const builder = this.dbService.builder;

      const prepared = builder
         .select()
         .from(usersTable)
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      const user = await prepared.get({ id });

      if (!user) {
         throw new NotFoundException("User not found");
      }

      return parse(SelectUserSchema, user);
   }

   async update(id: string, updateUserDto: UpdateUserDto) {
      const builder = this.dbService.builder;

      const prepared = builder
         .update(usersTable)
         .set(updateUserDto)
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      await prepared.run({ id });
   }
}
