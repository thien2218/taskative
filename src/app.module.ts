import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TodoModule } from "@/api/todo/todo.module";
import { AuthModule } from "./api/auth/auth.module";

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: `.env.${process.env.NODE_ENV}`
      }),
      TodoModule,
      AuthModule
   ],
   controllers: [],
   providers: []
})
export class AppModule {}
