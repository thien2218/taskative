import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./api/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessGuard } from "./api/auth/guards/access.guards";
import { UserModule } from "./api/user/user.module";

@Module({
   imports: [
      DatabaseModule,
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: `.env.${process.env.NODE_ENV}`
      }),
      AuthModule,
      UserModule
   ],
   providers: [
      {
         provide: APP_GUARD,
         useClass: AccessGuard
      }
   ]
})
export class AppModule {}
