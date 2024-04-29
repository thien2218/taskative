import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "@/database/database.module";
import { JwtModule } from "@nestjs/jwt";
import { RefreshStrategy } from "./stategies/refresh.strategy";
import { AccessStrategy } from "./stategies/access.strategy";

@Module({
   imports: [DatabaseModule, JwtModule],
   providers: [AuthService, RefreshStrategy, AccessStrategy],
   controllers: [AuthController]
})
export class AuthModule {}
