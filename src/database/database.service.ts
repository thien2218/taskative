import { createClient } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseService {
   private db: LibSQLDatabase;

   constructor(private readonly configService: ConfigService) {}

   onModuleInit() {
      const client = createClient({
         url: this.configService.get("TURSO_DATABASE_URL") as string,
         authToken: this.configService.get("TURSO_AUTH_TOKEN") as string
      });

      this.db = drizzle(client, { logger: true });
   }

   get builder() {
      return this.db;
   }

   handleDbError(err: any) {
      console.log(err);
      throw new BadRequestException(err.message);
   }
}
