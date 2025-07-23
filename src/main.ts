import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  initializeApp as initializeFirebaseApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { credential as firebaseCredential } from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

async function bootstrap() {
  const isLocalDeploy = process.env.NODE_ENV == 'local';
  let httpsOptions = null;
  if (isLocalDeploy) {
    httpsOptions = {
      key: fs.readFileSync('./local-certs/localhost-key.pem'),
      cert: fs.readFileSync('./local-certs/localhost.pem'),
    };
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  if (isLocalDeploy) {
    app.enableCors({
      origin: ['https://localhost:3000', 'https://localhost:3001'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: [
        'https://popo.poapper.club',
        'https://popo-dev.poapper.club',
        'https://admin.popo.poapper.club',
        'https://admin.popo-dev.poapper.club',
        'https://popo.postech.ac.kr',
      ],
      credentials: true,
    });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('POPO API')
    .setDescription('POPO API Documentation')
    .setVersion('1.0')
    .addCookieAuth('Authentication')
    // TODO: Paxi 출시 후 추가
    // .setExternalDoc(
    //   'Paxi API 문서',
    //   'https://api.paxi.popo.poapper.club/swagger',
    // )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  initializeFirebaseApp({
    credential: firebaseCredential.cert(
      configService.get('firebase') as ServiceAccount,
    ),
  });

  await app.listen(4000);
}

bootstrap();
