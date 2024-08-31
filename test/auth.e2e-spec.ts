import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "app.module";
import * as cookieParser from "cookie-parser";
import { loginStub, signupStub } from "utils/stubs";
import { DatabaseService } from "database/database.service";
import { DatabaseModule } from "database/database.module";
import { usersTable } from "database/tables";
import { eq } from "drizzle-orm";

const exampleInvalidCreds = {
   email: "invalidemail",
   password: "pas",
   firstName:
      "This first name is written to exceed the maximum length of 32 characters",
   lastName:
      "This last name is written to exceed the maximum length of 32 characters",
   profileImage: "invalidurl"
};

describe("AuthController (e2e)", () => {
   let app: INestApplication;
   let dbService: DatabaseService;
   let accessToken: string;
   let refreshToken: string;

   beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule, DatabaseModule],
         providers: [DatabaseService]
      }).compile();

      dbService = moduleFixture.get<DatabaseService>(DatabaseService);
      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix("api");
      app.use(cookieParser());
      await app.init();
   });

   it("dbService should be defined", () => {
      expect(dbService).toBeDefined();
      expect(dbService.builder).toBeDefined();
   });

   afterAll(async () => {
      await dbService.builder
         .delete(usersTable)
         .where(eq(usersTable.email, loginStub().email));
   });

   describe("/auth/signup (POST)", () => {
      const path = "/api/auth/signup";

      Object.keys(signupStub()).forEach((key) => {
         it(`should send status code 400 when ${key} is invalid`, async () => {
            const invalidCreds = signupStub();
            const typedKey = key as keyof typeof invalidCreds;
            invalidCreds[typedKey] = exampleInvalidCreds[typedKey];

            await request(app.getHttpServer())
               .post(path)
               .send({
                  ...invalidCreds,
                  confirmPassword: invalidCreds.password
               })
               .expect(HttpStatus.BAD_REQUEST);
         });
      });

      it("should send status code 400 when email is already taken", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               ...signupStub(),
               email: "user1@gmail.com"
            })
            .expect(HttpStatus.BAD_REQUEST);
      });

      it("should send status code 400 when password and confirmPassword do not match", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               ...signupStub(),
               confirmPassword: "invalidpassword"
            })
            .expect(HttpStatus.BAD_REQUEST);
      });

      it("should set a cookie and authorization header with JWT tokens and send status code 201 when credentials are valid", async () => {
         const res = await request(app.getHttpServer())
            .post(path)
            .send({
               ...signupStub(),
               confirmPassword: signupStub().password
            })
            .expect(HttpStatus.CREATED);

         expect(res.header["set-cookie"]).toBeDefined();
         expect(res.header["authorization"]).toBeDefined();
      });
   });

   describe("/auth/login (POST)", () => {
      const path = "/api/auth/login";

      Object.keys(loginStub()).forEach((key) => {
         it(`should send status code 400 when ${key} is invalid`, async () => {
            const invalidCreds = loginStub();
            const typedKey = key as keyof typeof invalidCreds;
            invalidCreds[typedKey] = exampleInvalidCreds[typedKey];

            await request(app.getHttpServer())
               .post(path)
               .send(invalidCreds)
               .expect(HttpStatus.BAD_REQUEST);
         });
      });

      it("should send status code 400 when email is not found in the database", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               email: "invalid@email.com",
               password: "password"
            })
            .expect(HttpStatus.BAD_REQUEST);
      });

      it("should send status code 400 when user does not have a password in the database", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               email: "user1@gmail.com",
               password: "password"
            })
            .expect(HttpStatus.BAD_REQUEST);
      });

      it("should send status code 400 when password does not match with the one in the database", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               email: "john@doe.com",
               password: "invalidpassword"
            })
            .expect(HttpStatus.BAD_REQUEST);
      });

      it("should send status code 400 when user is already logged in", () => {
         return request(app.getHttpServer())
            .post(path)
            .set("Cookie", [
               `taskative_refreshToken=${process.env.TEST_JWT_TOKEN}`
            ])
            .auth(process.env.TEST_JWT_TOKEN as string, { type: "bearer" })
            .send(loginStub())
            .expect(HttpStatus.FORBIDDEN);
      });

      it("should set a cookie and authorization header with JWT tokens and send status code 200 when credentials are valid", async () => {
         const res = await request(app.getHttpServer())
            .post(path)
            .send(loginStub())
            .expect(HttpStatus.OK);

         expect(res.header["set-cookie"]).toBeDefined();
         expect(res.header["authorization"]).toBeDefined();

         accessToken = res.header["authorization"].split(" ")[1];
         refreshToken = (res.get("Set-Cookie") as string[])[0]
            .split(";")[0]
            .split("=")[1];
      });
   });

   describe("/auth/logout (POST)", () => {
      const path = "/api/auth/logout";

      it("should send status code 401 when user is not logged in", () => {
         return request(app.getHttpServer())
            .post(path)
            .expect(HttpStatus.FORBIDDEN);
      });

      it("should send status code 200 when user is logged in", () => {
         return request(app.getHttpServer())
            .post(path)
            .set("Cookie", [`taskative_refreshToken=${refreshToken}`])
            .auth(accessToken, { type: "bearer" })
            .expect(HttpStatus.OK);
      });
   });
});
