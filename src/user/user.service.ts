import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DatabaseService } from "src/database/database.service";
import { users } from "src/database/tables";
import { SelectUserSchema } from "src/utils/schemas";
import { SelectUserDto } from "src/utils/types";
import { parse } from "valibot";

@Injectable()
export class UserService {
   constructor(private readonly dbService: DatabaseService) {}

   async findOne(id: string): Promise<SelectUserDto> {
      const builder = this.dbService.builder;
      const prepared = builder
         .select()
         .from(users)
         .where(eq(users.id, sql.placeholder("id")))
         .prepare();

      const user = await prepared.get({ id });

      if (!user) {
         throw new NotFoundException("User not found");
      }

      return parse(SelectUserSchema, user);
   }
}
