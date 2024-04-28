import { DatabaseService } from "@/database/database.service";
import { users } from "@/database/tables/users";
import { SignupDto } from "@/tools/schemas/auth.schema";
import { SelectUserDto, SelectUserSchema } from "@/tools/schemas/user.schema";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

@Injectable()
export class AuthService {
   constructor(
      private readonly dbService: DatabaseService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
   ) {}

   // PUBLIC METHODS
   async signup(signupDto: SignupDto) {
      const db = this.dbService.getDb();
      const passwordHash = await argon2.hash(signupDto.password);

      const payload: SelectUserDto = {
         id: nanoid(25),
         email: signupDto.email,
         username: signupDto.username,
         profileImage: signupDto.profileImage,
         emailVerified: false,
         createdAt: new Date(),
         provider: "local"
      };

      const { refreshToken, accessToken } = await this.generateToken(payload);

      const prepared = db.insert(users).values(this.userPlaceholders());

      await prepared
         .run({
            ...payload,
            passwordHash,
            refreshToken,
            providerId: null
         })
         .catch(this.dbService.handleDbError);

      return {
         user: payload,
         refreshToken,
         accessToken
      };
   }

   // async login(loginDto: LoginDto) {
   //    // ...
   // }

   // PRIVATE METHODS
   private userPlaceholders() {
      return {
         id: sql.placeholder("id"),
         email: sql.placeholder("email"),
         username: sql.placeholder("username"),
         emailVerified: sql.placeholder("email_verified"),
         passwordHash: sql.placeholder("password_hash"),
         provider: sql.placeholder("provider"),
         providerId: sql.placeholder("provider_id"),
         refreshToken: sql.placeholder("refresh_token"),
         createdAt: sql.placeholder("created_at"),
         profileImage: sql.placeholder("profile_image")
      };
   }

   private async generateToken(user: SelectUserDto) {
      const payload = SelectUserSchema._parse(user);

      const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"),
            expiresIn: 60 * 15
         }),
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("REFRESH_TOKEN_SECRET"),
            expiresIn: 60 * 60 * 24 * 15
         })
      ]);

      return { accessToken, refreshToken };
   }
}
