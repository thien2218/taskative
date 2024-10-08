import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as cookieParser from "cookie-parser";
import { DatabaseService } from "database/database.service";
import * as request from "supertest";
import { loginStub, signupStub } from "utils/stubs";

jest.mock("database/database.service");

const invalidAuthFields = {
   email: "invalid@email",
   password: "pass",
   firstName: "A first name that is intentionally written to be too long",
   lastName: "A last name that is intentionally written to be too long",
   profileImage: "http://example.com"
};

describe("AuthController (e2e)", () => {
   let app: INestApplication;
   let dbService: DatabaseService;

   beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
      }).compile();

      dbService = moduleFixture.get<DatabaseService>(DatabaseService);
      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix("api");
      app.use(cookieParser());
      await app.init();
   });

   describe("/auth/signup (POST)", () => {
      Object.keys(signupStub()).forEach((key) => {
         it(`should send status code 400 when validation fails for ${key} field`, () => {
            const typedKey = key as keyof typeof invalidAuthFields;

            const invalidSignup = {
               ...signupStub(),
               confirmPassword: "password",
               [key]: invalidAuthFields[typedKey]
            };

            return request(app.getHttpServer())
               .post("/api/auth/signup")
               .send(invalidSignup)
               .expect(400);
         });
      });

      it("should send status code 400 when passwords don't match", () => {
         return request(app.getHttpServer())
            .post("/api/auth/signup")
            .send({
               ...signupStub(),
               confirmPassword: "password123"
            })
            .expect(400);
      });

      it("should send status code 400 when user has already existed", () => {
         jest
            .spyOn(dbService.builder, "transaction")
            .mockRejectedValueOnce("SQLITE ERROR");

         return request(app.getHttpServer())
            .post("/api/auth/signup")
            .send({
               ...signupStub(),
               confirmPassword: "password"
            })
            .expect({
               statusCode: 400,
               message: "SQLITE ERROR",
               error: "Bad Request"
            });
      });

      it("should send status code 201 with the tokens attached when user's account is successfully created", async () => {
         const response = await request(app.getHttpServer())
            .post("/api/auth/signup")
            .send({
               ...signupStub(),
               confirmPassword: "password"
            })
            .expect(201);

         expect(response.get("Set-Cookie")).toBeDefined();
         expect(response.get("Authorization")).toBeDefined();
      });
   });

   describe("/auth/login", () => {
      Object.keys(loginStub()).forEach((key) => {
         it(`should send status code 400 when validation fails for ${key} field`, () => {
            const typedKey = key as keyof typeof invalidAuthFields;

            const invalidLogin = {
               ...loginStub(),
               [key]: invalidAuthFields[typedKey]
            };

            return request(app.getHttpServer())
               .post("/api/auth/signup")
               .send(invalidLogin)
               .expect(400);
         });
      });
   });
});
