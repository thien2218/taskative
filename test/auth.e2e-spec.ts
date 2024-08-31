import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "app.module";
import * as cookieParser from "cookie-parser";

describe("AuthController (e2e)", () => {
   let app: INestApplication;

   beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix("api");
      app.use(cookieParser());
      await app.init();
   });

   describe("/auth/login (POST)", () => {
      const path = "/api/auth/login";

      it("should send status code 400 when email is in invalid format", () => {
         return request(app.getHttpServer())
            .post(path)
            .send({
               email: "invalidemail",
               password: "password"
            })
            .expect(HttpStatus.BAD_REQUEST);
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

      // it("should send status code 400 when user does not have a password in the database", () => {
      //    return request(app.getHttpServer())
      //       .post(path)
      //       .send({
      //          email: "test@gmail.com",
      //          password: "password"
      //       })
      //       .expect(HttpStatus.BAD_REQUEST);
      // });

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
            .send({
               email: "john@doe.com",
               password: "johndoe"
            })
            .expect(HttpStatus.FORBIDDEN);
      });

      it("should set a cookie and authorization header with JWT tokens and send status code 200 when email and password are correct", async () => {
         const response = await request(app.getHttpServer())
            .post(path)
            .send({
               email: "john@doe.com",
               password: "johndoe"
            })
            .expect(HttpStatus.OK);

         expect(response.header["set-cookie"]).toBeDefined();
         expect(response.header["authorization"]).toBeDefined();
      });
   });
});
