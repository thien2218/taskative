import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import * as cookieParser from "cookie-parser";

describe("AppController (e2e)", () => {
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

   it("/ (GET)", () => {
      return request(app.getHttpServer())
         .get("/api")
         .set("Cookie", [
            `taskative_refreshToken=${process.env.TEST_JWT_TOKEN}`
         ])
         .set("Authorization", `Bearer ${process.env.TEST_JWT_TOKEN}`)
         .expect(200)
         .expect("Hello World!");
   });
});
