import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "src/database/database.service";
import { users } from "src/database/tables";
import {
   AuthTokensDto,
   JwtPayload,
   LoginDto,
   SignupDto
} from "src/utils/types";

@Injectable()
export class AuthService {
   constructor(
      private readonly dbService: DatabaseService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
   ) {}

   async signup({ password, ...rest }: SignupDto): Promise<AuthTokensDto> {
      const builder = this.dbService.builder;
      const encryptedPassword = await hash(password, { timeCost: 10 });
      const id = nanoid(25);
      const tokens = await this.generateTokens({ sub: id, ...rest });

      const prepared = builder
         .insert(users)
         .values({
            id: sql.placeholder("id"),
            email: sql.placeholder("email"),
            encryptedPassword: sql.placeholder("encryptedPassword"),
            profileImage: sql.placeholder("profileImage"),
            firstName: sql.placeholder("firstName"),
            lastName: sql.placeholder("lastName"),
            refreshToken: sql.placeholder("refreshToken")
         })
         .returning()
         .prepare();

      await prepared
         .run({
            id,
            encryptedPassword,
            refreshToken: tokens.refreshToken,
            ...rest
         })
         .catch(this.dbService.handleDbError);

      return tokens;
   }

   async login({ email, password }: LoginDto): Promise<AuthTokensDto> {
      const builder = this.dbService.builder;
      const prepared = builder
         .select()
         .from(users)
         .where(eq(users.email, sql.placeholder("email")))
         .prepare();

      const user = await prepared
         .get({ email })
         .catch(this.dbService.handleDbError);

      if (!user) {
         throw new BadRequestException("Invalid email or password");
      }

      if (user.refreshToken) {
         throw new BadRequestException("User already logged in");
      }

      if (!user.encryptedPassword) {
         throw new BadRequestException("Incorrect login method");
      }

      const isPasswordValid = await verify(user.encryptedPassword, password);

      if (!isPasswordValid) {
         throw new BadRequestException("Invalid email or password");
      }

      const payload = {
         sub: user.id,
         email: user.email,
         profileImage: user.profileImage,
         firstName: user.firstName,
         lastName: user.lastName
      };

      return this.generateTokens(payload);
   }

   async logout(email: string) {
      const builder = this.dbService.builder;
      const prepared = builder
         .update(users)
         .set({ refreshToken: null })
         .where(eq(users.email, sql.placeholder("email")))
         .prepare();

      await prepared.run({ email }).catch(this.dbService.handleDbError);
   }

   private async generateTokens(
      payload: Omit<JwtPayload, "exp">
   ): Promise<AuthTokensDto> {
      const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("ACCESS_EXPIRY")
         }),
         this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("REFRESH_EXPIRY")
         })
      ]);

      return { accessToken, refreshToken };
   }
}
