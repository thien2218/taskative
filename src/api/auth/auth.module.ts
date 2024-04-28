import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "@/database/database.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";

@Module({
   imports: [DatabaseModule, JwtModule, ConfigModule],
   providers: [AuthService],
   controllers: [AuthController]
})
export class AuthModule {}
