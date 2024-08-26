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

   async login({ email, password }: LoginDto): Promise<AuthTokensDto> {
      const builder = this.dbService.builder;

      const getUserQuery = builder
         .select({
            id: usersTable.id,
            encodedPassword: usersTable.encodedPassword,
            encodedRefreshToken: usersTable.encodedRefreshToken,
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

      const { id, encodedRefreshToken, encodedPassword, ...rest } = user;

      if (encodedRefreshToken) {
         throw new BadRequestException("User already logged in");
      }
      if (!encodedPassword) {
         throw new BadRequestException("Incorrect login method");
      }
      if (!(await verify(encodedPassword, password))) {
         throw new BadRequestException("Invalid email or password");
      }

      const payload = { sub: id, email, ...rest };
      const tokens = await this.generateTokens(payload);
      const newEncodedRefreshToken = await hash(tokens.refreshToken);

      const updateUserQuery = builder
         .update(usersTable)
         .set({ encodedRefreshToken: newEncodedRefreshToken })
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      await updateUserQuery.run({ id: user.id });

      return tokens;
   }

   async logout(id: string) {
      const builder = this.dbService.builder;

      const query = builder
         .update(usersTable)
         .set({ encodedRefreshToken: null })
         .where(eq(usersTable.id, sql.placeholder("id")))
         .prepare();

      await query.run({ id }).catch(this.dbService.handleDbError);
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
