import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { DatabaseService } from "database/database.service";
import { DatabaseModule } from "database/database.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
   jwtPayloadStub,
   loginStub,
   oauthStub,
   signupStub,
   tokensStub
} from "utils/stubs";
import { BadRequestException } from "@nestjs/common";
import * as argon2 from "argon2";
import { nanoid } from "nanoid";
import { AuthTokens } from "utils/types";

jest.mock("database/database.service");
jest.mock("argon2");
jest.mock("nanoid");

describe("AuthService", () => {
   let service: AuthService;
   let dbService: DatabaseService;

   const userId = "userId";
   const encodedPassword = "encodedPassword";
   const encodedRefreshToken = "encodedRefreshToken";
   const signedToken = "signedToken";

   const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue(signedToken),
      verifyAsync: jest.fn().mockResolvedValue({
         exp: Date.now() / 1000 + 15 * 24 * 60 * 60
      })
   };

   const mockConfigService = {
      get: jest.fn().mockReturnValue("expiry")
   };

   beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [DatabaseModule, JwtModule],
         providers: [
            AuthService,
            {
               provide: JwtService,
               useValue: mockJwtService
            },
            {
               provide: ConfigService,
               useValue: mockConfigService
            }
         ]
      }).compile();

      service = module.get(AuthService);
      dbService = module.get(DatabaseService);
   });

   beforeEach(() => {
      jest.clearAllMocks();
   });

   describe("signup", () => {
      it("should be defined", () => {
         expect(service.signup).toBeDefined();
      });

      it("should insert the user into the database with transaction", async () => {
         await service.signup(signupStub());
         expect(dbService.builder.transaction).toHaveBeenCalled();
      });

      it("should return a pair of access and refresh token", async () => {
         const tokens = await service.signup(signupStub());
         expect(tokens).toEqual(tokensStub());
      });
   });

   describe("login", () => {
      const login = () => service.login(loginStub());

      it("should be defined", () => {
         expect(service.login).toBeDefined();
      });

      beforeAll(async () => {
         jest
            .spyOn(dbService.builder, "get")
            .mockResolvedValue({ encodedPassword });
         jest.spyOn(argon2, "verify").mockResolvedValue(true);
         jest.spyOn(argon2, "hash").mockResolvedValue(encodedRefreshToken);
      });

      it("should get the user from the database with the email", async () => {
         await login();

         expect(dbService.builder.get).toHaveBeenCalledWith({
            email: loginStub().email
         });
      });

      it("should raise an exception if user is not found", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValueOnce(undefined);

         await expect(service.login(loginStub())).rejects.toThrow(
            BadRequestException
         );
      });

      it("should raise an exception if password doesn't exist for that user instance", async () => {
         jest
            .spyOn(dbService.builder, "get")
            .mockResolvedValueOnce({ encodedPassword: null });

         await expect(service.login(loginStub())).rejects.toThrow(
            BadRequestException
         );
      });

      it("should raise an exception if entered password doesn't match with the hashed one", async () => {
         jest.spyOn(argon2, "verify").mockResolvedValueOnce(false);

         await expect(service.login(loginStub())).rejects.toThrow(
            BadRequestException
         );
      });

      it("should store the hashed refresh token to the user's record", async () => {
         await login();

         expect(argon2.hash).toHaveBeenCalled();
         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({ encodedRefreshToken });
      });

      it("should return a pair of access and refresh token", async () => {
         const tokens = await login();
         expect(tokens).toEqual(tokensStub());
      });
   });

   describe("logout", () => {
      it("should be defined", () => {
         expect(service.logout).toBeDefined();
      });

      it("should update the user record's hashed refresh token to null", async () => {
         await service.logout(userId);

         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            encodedRefreshToken: null
         });

         expect(dbService.builder.run).toHaveBeenCalledWith({
            id: userId
         });
      });
   });

   describe("refresh", () => {
      const refresh = () => service.refresh(userId, encodedRefreshToken);

      it("should be defined", () => {
         expect(service.refresh).toBeDefined();
      });

      beforeEach(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            encodedRefreshToken
         });
         jest.spyOn(argon2, "verify").mockResolvedValue(true);
         jest.spyOn(argon2, "hash").mockResolvedValue(encodedRefreshToken);
      });

      it("should get the user in the database with specified id", async () => {
         await refresh();

         expect(dbService.builder.select).toHaveBeenCalled();
         expect(dbService.builder.get).toHaveBeenCalledWith({ id: userId });
      });

      it("should raise an exception if user is not found", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue(undefined);
         await expect(refresh).rejects.toThrow(BadRequestException);
      });

      it("should raise an exception if hashed refresh token doesn't exist in user record", async () => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue({
            encodedRefreshToken: null
         });

         await expect(refresh).rejects.toThrow(BadRequestException);
      });

      it("should raise an exception when the current refresh token doesn't match with the hashed one", async () => {
         jest.spyOn(argon2, "verify").mockResolvedValue(false);
         await expect(refresh).rejects.toThrow(BadRequestException);
      });

      it("should generate a new access token", async () => {
         await refresh();
         expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
      });

      it("should return only the access token when the current refresh token is relatively new", async () => {
         const tokens = await refresh();
         expect(tokens).toEqual({ ...tokensStub(), refreshToken: null });
      });

      it("should generate a new refresh token and update the user record in the database if the current refresh token is relatively old", async () => {
         jest.spyOn(mockJwtService, "verifyAsync").mockResolvedValue({
            exp: Date.now() / 1000 + 60 * 60
         });

         await refresh();

         expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
         expect(argon2.hash).toHaveBeenCalled();
         expect(dbService.builder.update).toHaveBeenCalled();

         const mockUpdate = (dbService.builder.update as jest.Mock).mock
            .results[0].value;

         expect(mockUpdate.set).toHaveBeenCalledWith({
            encodedRefreshToken
         });
      });

      it("should return both the access and the refresh token is relatively old", async () => {
         const tokens = await refresh();
         expect(tokens).toEqual(tokensStub());
      });
   });

   describe("validateOAuthUser", () => {
      it("should be defined", () => {
         expect(service.validateOAuthUser).toBeDefined();
      });

      beforeAll(() => {
         jest.spyOn(dbService.builder, "get").mockResolvedValue(undefined);
         (nanoid as jest.Mock).mockReturnValue("456");
      });

      it("should get the user id from the database with the email", async () => {
         await service.validateOAuthUser(oauthStub());

         expect(dbService.builder.get).toHaveBeenCalledWith({
            email: oauthStub().email
         });
      });

      it("should return the user payload if the user's already exist", async () => {
         const { provider, ...rest } = oauthStub();
         jest
            .spyOn(dbService.builder, "get")
            .mockResolvedValueOnce({ id: "123" });

         const userPayload = await service.validateOAuthUser(oauthStub());
         expect(userPayload).toEqual({ sub: "123", ...rest });
      });

      it("should create a new user if the user doesn't exist", async () => {
         const { provider, ...rest } = oauthStub();
         const userPayload = await service.validateOAuthUser(oauthStub());

         expect(dbService.builder.transaction).toHaveBeenCalled();
         expect(userPayload).toEqual({ sub: "456", ...rest });
      });
   });

   describe("generateTokens", () => {
      let tokens: AuthTokens;

      it("should be defined", () => {
         expect(service.generateTokens).toBeDefined();
      });

      beforeEach(async () => {
         tokens = await service.generateTokens(jwtPayloadStub());
      });

      it("should generate 2 tokens", () => {
         expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      });

      it("should returns 2 tokens", () => {
         expect(tokens).toEqual(tokensStub());
      });
   });
});
