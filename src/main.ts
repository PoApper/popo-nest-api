import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [
      "http://localhost:3000", "http://localhost:3001",
      "http://141.164.44.77", "http://141.164.44.77:1986",
      "http://popo.postech.ac.kr", "http://popo.postech.ac.kr:1986",
      "https://popo.postech.ac.kr", "https://popo.postech.ac.kr:1986"
    ],
    credentials: true
  });
  await app.listen(4000);
}

bootstrap();
