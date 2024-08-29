import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { DatabaseService } from "database/database.service";
import { DatabaseModule } from "database/database.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { signupStub } from "utils/stubs";

jest.mock("database/database.service");

describe("AuthService", () => {
   let service: AuthService;
   let dbService: DatabaseService;

   const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue("token")
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

      service = module.get<AuthService>(AuthService);
      dbService = module.get<DatabaseService>(DatabaseService);

      jest.clearAllMocks();
   });

   describe("signup", () => {
      it("should be defined", () => {
         expect(service.signup).toBeDefined();
      });

      it("should return a pair of access and refresh token", async () => {
         const tokens = await service.signup(signupStub());
         expect(typeof tokens.accessToken).toBe("string");
         expect(typeof tokens.refreshToken).toBe("string");
      });
   });
});
