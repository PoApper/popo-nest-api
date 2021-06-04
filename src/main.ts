import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('POPO API')
    .setDescription('POPO Swagger API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
}

bootstrap();
