import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { DatabaseService } from "database/database.service";
import { boardsTable, profilesTable, usersTable } from "database/tables";
import {
   AuthTokens,
   JwtPayload,
   LoginDto,
   OAuthValidateDto,
   SignupDto
} from "utils/types";

@Injectable()
export class AuthService {
   constructor(
      private readonly dbService: DatabaseService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
   ) {}

   async signup({
      email,
      password,
      ...rest
   }: SignupDto): Promise<AuthTokens & { boardId: string }> {
      const id = nanoid(25);
      const boardId = nanoid(25);
      const encodedPassword = await hash(password);
      const tokens = await this.generateTokens({ sub: id, email, ...rest });
      const encodedRefreshToken = await hash(tokens.refreshToken);

      await this.dbService.builder
         .transaction(async (tx) => {
            await tx
               .insert(usersTable)
               .values({
                  id,
                  email,
                  encodedPassword,
                  encodedRefreshToken
               })
               .run();

            await tx
               .insert(profilesTable)
               .values({ userId: id, ...rest })
               .run();

            await tx
               .insert(boardsTable)
               .values({ id: boardId, name: "My Task Board", userId: id })
               .run();
         })
         .catch(this.dbService.handleDbError);

      return { ...tokens, boardId };
   }

   async login({ email, password }: LoginDto): Promise<AuthTokens> {
      const query = this.dbService.prepared.getUserByEmailQuery;

      const user = await query
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

      const updateUserQuery = this.dbService.builder
         .update(usersTable)
         .set({ encodedRefreshToken })
         .where(eq(usersTable.id, user.id));

      await updateUserQuery.run().catch(this.dbService.handleDbError);

      return tokens;
   }

   async logout(id: string) {
      const query = this.dbService.prepared.logUserOutQuery;
      await query.run({ id }).catch(this.dbService.handleDbError);
   }

   async refresh(
      id: string,
      curRefreshToken: string
   ): Promise<{ accessToken: string; refreshToken: string | null }> {
      const getUserQuery = this.dbService.prepared.getUserRefreshTokenQuery;

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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exp, iat, ...payload } = await this.jwtService.verifyAsync<
         JwtPayload & { iat: number }
      >(curRefreshToken);

      const accessToken = await this.jwtService.signAsync(payload, {
         expiresIn: this.configService.get("ACCESS_EXPIRY")
      });

      let refreshToken: string | null = null;

      if (exp - Date.now() / 1000 < 7 * 24 * 60 * 60) {
         refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("REFRESH_EXPIRY")
         });

         const encodedRefreshToken = await hash(refreshToken);

         const updateUserQuery = this.dbService.builder
            .update(usersTable)
            .set({ encodedRefreshToken })
            .where(eq(usersTable.id, id));

         await updateUserQuery.run().catch(this.dbService.handleDbError);
      }

      return { accessToken, refreshToken };
   }

   async validateOAuthUser({ email, provider, ...rest }: OAuthValidateDto) {
      const builder = this.dbService.builder;

      const getUserDataQuery = this.dbService.prepared.validateOAuthUserQuery;

      const data = await getUserDataQuery
         .get({ email })
         .catch(this.dbService.handleDbError);

      if (data) {
         const { id, emailVerified, providers } = data;

         if (!emailVerified || !providers.includes(provider)) {
            const updateUserQuery = builder
               .update(usersTable)
               .set({
                  emailVerified: true,
                  providers: [...providers, provider]
               })
               .where(eq(usersTable.id, id));

            await updateUserQuery.run().catch(this.dbService.handleDbError);
         }

         return { sub: id, email, ...rest };
      }

      const id = nanoid(25);

      await builder
         .transaction(async (tx) => {
            await tx
               .insert(usersTable)
               .values({
                  id,
                  email,
                  providers: [provider],
                  emailVerified: true
               })
               .run();

            await tx
               .insert(profilesTable)
               .values({ userId: id, ...rest })
               .run();
         })
         .catch(this.dbService.handleDbError);

      return { sub: id, email, ...rest };
   }

   async generateTokens(payload: Omit<JwtPayload, "exp">): Promise<AuthTokens> {
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
