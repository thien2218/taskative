import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "../database.service";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import { ConfigService } from "@nestjs/config";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

describe("DatabaseService", () => {
   let service: DatabaseService;

   const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
         switch (key) {
            case "TURSO_DATABASE_URL":
               return process.env.TURSO_DATABASE_URL;
            case "TURSO_AUTH_TOKEN":
               return process.env.TURSO_AUTH_TOKEN;
         }
      })
   };

   beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
         providers: [
            DatabaseService,
            {
               provide: ConfigService,
               useValue: mockConfigService
            }
         ]
      }).compile();

      service = module.get<DatabaseService>(DatabaseService);
      service.onModuleInit();
   });

   it("should be defined", () => {
      expect(service).toBeDefined();
   });

   it("should have a builder property", () => {
      expect(service.builder).toBeDefined();
   });

   it("should be able to connect to the database", async () => {
      const result = await service.builder.run(sql`SELECT 1 as value`);
      expect(result.rows[0].value).toBe(1);
   });
});
