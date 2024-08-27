import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import * as dotenv from "dotenv";
import { AccessStrategy } from "./strategies/access.strategy";
import { DatabaseModule } from "src/database/database.module";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

@Module({
   imports: [
      DatabaseModule,
      JwtModule.register({ secret: process.env.JWT_SECRET, global: true })
   ],
   controllers: [AuthController],
   providers: [AuthService, AccessStrategy]
})
export class AuthModule {}
