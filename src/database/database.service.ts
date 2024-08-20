import { createClient, LibsqlError } from "@libsql/client";
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

      this.db = drizzle(client);
   }

   get builder() {
      return this.db;
   }

   handleDbError(err: any) {
      if (err instanceof LibsqlError) {
         const splitErr = err.message.split(": ");
         const reason = splitErr[splitErr.length - 2];
         const field = splitErr[splitErr.length - 1].split(".")[1];

         const message = { field, reason };

         throw new BadRequestException(message);
      } else {
         throw new BadRequestException(err);
      }
   }
}
