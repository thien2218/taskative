import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
   FastifyAdapter,
   NestFastifyApplication
} from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";

async function bootstrap() {
   const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter()
   );

   await app.register(fastifyCookie, {
      secret: process.env.COOKIE_SECRET,
      parseOptions: {
         path: "/auth"
      }
   });

   app.setGlobalPrefix("api");
   await app.listen(3333);
}

bootstrap();
