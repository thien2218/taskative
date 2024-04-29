import { DatabaseService } from "@/database/database.service";
import { users } from "@/database/tables/users";
import { LoginDto, SignupDto } from "@/tools/schemas/auth.schema";
import { SelectUserDto, SelectUserSchema } from "@/tools/schemas/user.schema";
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

      const authData = await this.generateToken(payload);

      const prepared = db.insert(users).values(this.userPlaceholders());

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
         .where(eq(users.email, sql.placeholder("email")));

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

      const authData = await this.generateToken(user);

      const preparedLoginUser = db
         .update(users)
         .set({ refreshToken: authData.refreshToken })
         .where(eq(users.id, sql.placeholder("id")));

      await preparedLoginUser.run({ id: user.id });

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
         .returning();

      if (!(await prepared.get({ id: userId }))) {
         throw new Error("User is not logged in");
      } else {
         return "User logged out successfully";
      }
   }

   // PRIVATE METHODS
   private userPlaceholders() {
      return {
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
      };
   }

   private async generateToken(user: SelectUserDto) {
      const payload = parse(SelectUserSchema, user);

      const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"),
            expiresIn: 60 * 15
         }),
         this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>("REFRESH_TOKEN_SECRET"),
            expiresIn: 60 * 60 * 24 * 30
         })
      ]);

      return { user: payload, accessToken, refreshToken };
   }
}
