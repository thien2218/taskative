import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import * as dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

@Module({
   imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
   controllers: [AuthController],
   providers: [AuthService]
})
export class AuthModule {}
