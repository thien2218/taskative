import { Module } from "@nestjs/common";
import { ListController } from "./list.controller";
import { ListService } from "./list.service";
import { DatabaseModule } from "src/database/database.module";

@Module({
   imports: [DatabaseModule],
   controllers: [ListController],
   providers: [ListService]
})
export class ListModule {}
