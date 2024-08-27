import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./api/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AccessGuard } from "./api/auth/guards/access.guard";
import { UserModule } from "./api/user/user.module";
import { TaskModule } from "./api/task/task.module";
import { ListModule } from "./api/list/list.module";
import { AppController } from "./app.controller";

@Module({
   imports: [
      DatabaseModule,
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: `.env.${process.env.NODE_ENV}`
      }),
      AuthModule,
      UserModule,
      TaskModule,
      ListModule
   ],
   providers: [
      {
         provide: APP_GUARD,
         useClass: AccessGuard
      }
   ],
   controllers: [AppController]
})
export class AppModule {}
