import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "src/database/database.service";
import { profilesTable, usersTable } from "src/database/tables";
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

   /* ======================================== */
   /* ======================================== */
   /* ======================================== */
   async signup({
      email,
      password,
      ...rest
   }: SignupDto): Promise<AuthTokensDto> {
      const builder = this.dbService.builder;
      const id = nanoid(25);
      const encodedPassword = await hash(password);
      const tokens = await this.generateTokens({ sub: id, email, ...rest });
      const encodedRefreshToken = await hash(tokens.refreshToken);

      await builder.transaction(async (tx) => {
         await tx
            .insert(usersTable)
            .values({
               id,
               email,
               encodedPassword,
               encodedRefreshToken
            })
            .run()
            .catch(this.dbService.handleDbError);

         await tx
            .insert(profilesTable)
            .values({ userId: id, ...rest })
            .run()
            .catch(this.dbService.handleDbError);
      });

      return tokens;
   }

   /* ======================================== */
   /* ======================================== */
   /* ======================================== */
   async login({ email, password }: LoginDto): Promise<AuthTokensDto> {
      const builder = this.dbService.builder;

      const getUserQuery = builder
         .select({
            id: usersTable.id,
            encodedPassword: usersTable.encodedPassword,
            profileImage: profilesTable.profileImage,
            firstName: profilesTable.firstName,
            lastName: profilesTable.lastName
         })
         .from(usersTable)
         .where(eq(usersTable.email, sql.placeholder("email")))
         .innerJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
         .prepare();

      const user = await getUserQuery
         .get({ email })
         .catch(this.dbService.handleDbError);

      if (!user) {
         throw new BadRequestException("Invalid email or password");
      }

      const { id, encodedPassword, ...rest } = user;

      if (!encodedPassword) {
         throw new BadRequestException("Incorrect login method");
      }
      if (!(await verify(encodedPassword, password))) {
         throw new BadRequestException("Invalid email or password");
      }

      const payload = { sub: id, email, ...rest };
      const tokens = await this.generateTokens(payload);
      const encodedRefreshToken = await hash(tokens.refreshToken);

      const updateUserQuery = builder
         .update(usersTable)
         .set({ encodedRefreshToken })
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      await updateUserQuery
         .run({ id: user.id })
         .catch(this.dbService.handleDbError);

      return tokens;
   }

   /* ======================================== */
   /* ======================================== */
   /* ======================================== */
   async logout(id: string) {
      const builder = this.dbService.builder;

      const query = builder
         .update(usersTable)
         .set({ encodedRefreshToken: null })
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      await query.run({ id }).catch(this.dbService.handleDbError);
   }

   /* ======================================== */
   /* ======================================== */
   /* ======================================== */
   async refresh(
      id: string,
      curRefreshToken: string
   ): Promise<{ accessToken: string; refreshToken: string | null }> {
      const builder = this.dbService.builder;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, iat, ...payload } = await this.jwtService.verifyAsync<
         JwtPayload & { iat: number }
      >(curRefreshToken);

      if (exp * 1000 < Date.now()) {
         throw new BadRequestException("Refresh token expired");
      }

      const getUserQuery = builder
         .select({ encodedRefreshToken: usersTable.encodedRefreshToken })
         .from(usersTable)
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      const data = await getUserQuery
         .get({ id })
         .catch(this.dbService.handleDbError);

      if (!data) {
         throw new BadRequestException("Invalid refresh token");
      }
      if (!data.encodedRefreshToken) {
         throw new BadRequestException("User already logged out");
      }
      if (!(await verify(data.encodedRefreshToken, curRefreshToken))) {
         throw new BadRequestException("Invalid refresh token");
      }

      const accessToken = await this.jwtService.signAsync(payload, {
         expiresIn: this.configService.get("ACCESS_EXPIRY")
      });

      let refreshToken: string | null = null;

      if (exp - Date.now() / 1000 < 7 * 24 * 60 * 60) {
         refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("REFRESH_EXPIRY")
         });

         const encodedRefreshToken = await hash(refreshToken);

         const updateUserQuery = builder
            .update(usersTable)
            .set({ encodedRefreshToken })
            .where(eq(usersTable.id, sql.placeholder("id")))
            .prepare();

         await updateUserQuery.run({ id }).catch(this.dbService.handleDbError);
      }

      return { accessToken, refreshToken };
   }

   private async generateTokens(
      payload: Omit<JwtPayload, "exp">
   ): Promise<AuthTokensDto> {
      const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload, {
            expiresIn: "1s"
         }),
         this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("REFRESH_EXPIRY")
         })
      ]);

      return { accessToken, refreshToken };
   }
}
