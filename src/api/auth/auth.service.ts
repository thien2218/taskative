import { DatabaseService } from "@/database/database.service";
import { users } from "@/database/tables/users";
import { SelectUserSchema } from "@/tools/schemas/user.schema";
import { LoginDto, SignupDto } from "@/tools/types/auth.type";
import { SelectUserDto, UserRefresh } from "@/tools/types/user.type";
import {
   ConflictException,
   Injectable,
   UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parse } from "valibot";

const NEW_REFRESH_WINDOW = 14;
const ACCESS_TOKEN_LIFETIME = 60 * 15;
const REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
   constructor(
      private readonly dbService: DatabaseService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
   ) {}

   // PUBLIC METHODS
   async signup({ password, ...rest }: SignupDto) {
      const db = this.dbService.getDb();
      const passwordHash = await argon2.hash(password, {
         timeCost: 10
      });

      const payload: SelectUserDto = {
         id: nanoid(25),
         ...rest,
         emailVerified: false,
         createdAt: Math.floor(new Date().getTime() / 1000),
         provider: "local"
      };

      const authData = await this.generateTokens(payload);

      const prepared = db
         .insert(users)
         .values({
            id: sql.placeholder("id"),
            email: sql.placeholder("email"),
            username: sql.placeholder("username"),
            emailVerified: sql.placeholder("emailVerified"),
            passwordHash: sql.placeholder("passwordHash"),
            provider: sql.placeholder("provider"),
            providerId: sql.placeholder("providerId"),
            refreshToken: sql.placeholder("refreshToken"),
            createdAt: sql.placeholder("createdAt"),
            profileImage: sql.placeholder("profileImage")
         })
         .prepare();

      await prepared
         .run({
            ...payload,
            passwordHash,
            refreshToken: authData.refreshToken,
            providerId: null
         })
         .catch(this.dbService.handleDbError);

      return authData;
   }

   async login({ email, password }: LoginDto) {
      const db = this.dbService.getDb();

      const preparedGetUser = db
         .select()
         .from(users)
         .where(eq(users.email, sql.placeholder("email")))
         .prepare();

      const user = await preparedGetUser.get({ email });

      if (!user) {
         throw new UnauthorizedException("Incorrect email or password");
      }
      if (!user.passwordHash) {
         throw new ConflictException(
            "This email is linked to another login method"
         );
      }
      if (!(await argon2.verify(user.passwordHash, password))) {
         throw new UnauthorizedException("Incorrect email or password");
      }

      const authData = await this.generateTokens(user);

      const preparedLoginUser = db
         .update(users)
         .set({ refreshToken: authData.refreshToken })
         .where(eq(users.id, sql.placeholder("id")))
         .prepare();

      await preparedLoginUser
         .run({ id: user.id })
         .catch(this.dbService.handleDbError);

      return authData;
   }

   async logout(userId: string) {
      const db = this.dbService.getDb();

      const prepared = db
         .update(users)
         .set({ refreshToken: null })
         .where(
            sql`${users.id} = ${sql.placeholder("id")} AND ${users.refreshToken} IS NOT NULL`
         )
         .returning()
         .prepare();

      if (!(await prepared.get({ id: userId }))) {
         throw new UnauthorizedException("User is not logged in");
      } else {
         return "User logged out successfully";
      }
   }

   async refresh({ id, refreshToken, exp }: UserRefresh) {
      const db = this.dbService.getDb();
      const now = Math.floor(new Date().getTime() / 1000);
      const timeLeftInDays = +((exp - now) / (60 * 60 * 24)).toFixed(2);

      const preparedGetUser = db
         .select()
         .from(users)
         .where(eq(users.id, sql.placeholder("id")))
         .prepare();

      const user = await preparedGetUser.get({ id });

      if (!user) {
         throw new UnauthorizedException("User not found");
      }
      if (!user.refreshToken) {
         throw new UnauthorizedException("User is not logged in");
      }
      if (user.refreshToken !== refreshToken) {
         throw new ConflictException("Invalid refresh token");
      }

      if (timeLeftInDays < NEW_REFRESH_WINDOW) {
         const authData = await this.generateTokens(user);

         const preparedRefreshUser = db
            .update(users)
            .set({ refreshToken: authData.refreshToken })
            .where(eq(users.id, sql.placeholder("id")))
            .prepare();

         await preparedRefreshUser
            .run({ id })
            .catch(this.dbService.handleDbError);

         return authData;
      }

      // Only refresh the access token if the refresh token is still new
      const payload = parse(SelectUserSchema, user);

      const accessToken = await this.jwtService.signAsync(payload, {
         secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"),
         expiresIn: ACCESS_TOKEN_LIFETIME
      });

      return { user: payload, accessToken, refreshToken: null };
   }

   // PRIVATE HELPERS
   private async generateTokens(user: SelectUserDto) {
      const payload = parse(SelectUserSchema, user);

      const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"),
            expiresIn: ACCESS_TOKEN_LIFETIME
         }),
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("REFRESH_TOKEN_SECRET"),
            expiresIn: REFRESH_TOKEN_LIFETIME
         })
      ]);

      return { user: payload, accessToken, refreshToken };
   }
}
