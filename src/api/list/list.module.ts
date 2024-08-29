import { Module } from "@nestjs/common";
import { ListController } from "./list.controller";
import { ListService } from "./list.service";
import { DatabaseModule } from "database/database.module";

@Module({
   imports: [DatabaseModule],
   controllers: [ListController],
   providers: [ListService]
})
export class ListModule {}
