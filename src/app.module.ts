import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessGuard } from "./auth/guards/access.guards";

@Module({
   imports: [
      DatabaseModule,
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: `.env.${process.env.NODE_ENV}`
      }),
      AuthModule
   ],
   controllers: [],
   providers: [
      {
         provide: APP_GUARD,
         useClass: AccessGuard
      }
   ]
})
export class AppModule {}
