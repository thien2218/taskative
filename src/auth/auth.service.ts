import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { DatabaseService } from "src/database/database.service";
import { AuthTokensDto, LoginDto, SignupDto } from "src/utils/types";

@Injectable()
export class AuthService {
   constructor(
      private readonly dbService: DatabaseService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
   ) {}

   async login({ email, password }: LoginDto): Promise<AuthTokensDto> {
      return;
   }

   async signup({ password, ...rest }: SignupDto): Promise<AuthTokensDto> {
      return;
   }

   async logout() {
      return;
   }

   private async generateTokens(email: string): Promise<AuthTokensDto> {}
}
