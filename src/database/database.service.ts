import { LibSQLDatabase } from "drizzle-orm/libsql";
import {
   BadRequestException,
   Injectable,
   InternalServerErrorException
} from "@nestjs/common";
import * as queryModule from "./queries";

type omitted = "findTasksQueryConstructor";
type SQLError = { fields?: string[]; code: string };

const { default: builder, ...preparedQuery } = queryModule;

@Injectable()
export class DatabaseService {
   private db: LibSQLDatabase;
   prepared: Omit<typeof preparedQuery, omitted>;

   onModuleInit() {
      this.prepared = preparedQuery;
      this.db = builder;
   }

   get builder() {
      return this.db;
   }

   handleDbError({ message }: { message: string }) {
      console.log(message);

      if (message.includes("SQLITE_CONSTRAINT")) {
         const chunks = message.split(": ");
         const msg = chunks[1];
         const error: SQLError = { code: chunks[chunks.length - 1] };

         if (message.includes("UNIQUE")) {
            const fields = message
               .split(": ")[2]
               .split(", ")
               .map((f) => f);

            error.fields = fields;
         }

         throw new BadRequestException({
            state: "error",
            message: msg,
            error
         });
      }

      throw new InternalServerErrorException({
         state: "error",
         message,
         error: { code: "DB_ERROR" }
      });
   }
}
