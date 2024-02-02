import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TodoModule } from "todo/todo.module";

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: `.env.${process.env.NODE_ENV}`
      }),
      TodoModule
   ],
   controllers: [],
   providers: []
})
export class AppModule {}
