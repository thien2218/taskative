import { createClient } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseService {
   protected db: LibSQLDatabase;

   constructor(private readonly configService: ConfigService) {}

   onModuleInit() {
      const client = createClient({
         url: this.configService.get("TURSO_DATABASE_URL") as string,
         authToken: this.configService.get("TURSO_AUTH_TOKEN") as string
      });

      this.db = drizzle(client);
   }
}
