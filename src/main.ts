import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookie from "@fastify/cookie";
import {
   FastifyAdapter,
   NestFastifyApplication
} from "@nestjs/platform-fastify";

async function bootstrap() {
   const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter()
   );

   app.register(cookie, {
      secret: process.env.COOKIE_SECRET,
      parseOptions: {
         path: "/auth"
      }
   });

   app.setGlobalPrefix("api");
   await app.listen(3333);
}

bootstrap();
