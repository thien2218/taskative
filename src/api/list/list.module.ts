import { Module } from "@nestjs/common";
import { ListController } from "./list.controller";
import { ListService } from "./list.service";
import { DatabaseService } from "database/database.service";

@Module({
   controllers: [ListController],
   providers: [ListService, DatabaseService]
})
export class ListModule {}
