import { Module } from "@nestjs/common";
import { BoardController } from "./board.controller";
import { BoardService } from "./board.service";
import { DatabaseModule } from "database/database.module";

@Module({
   imports: [DatabaseModule],
   controllers: [BoardController],
   providers: [BoardService]
})
export class BoardModule {}
