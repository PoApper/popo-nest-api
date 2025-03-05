import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as fs from 'fs';

async function bootstrap() {
  const isLocalDeploy = process.env.NODE_ENV == 'local';
  let httpsOptions = null;
  if (isLocalDeploy) {
    httpsOptions = {
      key: fs.readFileSync('./local-certs/private-key.pem'),
      cert: fs.readFileSync('./local-certs/cert.pem'),
    };
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.use(cookieParser());

  if (isLocalDeploy) {
    app.enableCors({
      origin: ['https://localhost:3000', 'https://localhost:3001'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('POPO API')
    .setDescription('POPO Swagger API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(4000);
}

bootstrap();
