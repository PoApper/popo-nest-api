import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { WhitebookDto } from './whitebook.dto';
import { DataSource } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileService } from 'src/file/file.service';
import { UserService } from '../user/user.service';
import { SettingService } from '../setting/setting.service';
import { JwtService } from '@nestjs/jwt';
import { TestUtils } from '../../utils/test-utils';
import { AppModule } from 'src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import configurations from 'src/config/configurations';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';

describe('WhitebookController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let jwtService: JwtService;
  let testUtils: TestUtils;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configurations],
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return dbConfig;
          },
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            secret: process.env.JWT_ACCESS_TOKEN_SECRET,
            signOptions: {
              expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
            },
          }),
        }),
        AppModule,
      ],
    })
      .overrideProvider(FileService)
      .useValue({
        uploadFile: jest.fn().mockImplementation(async (key: string) => {
          return `${process.env.S3_CF_DIST_URL}/${key}`;
        }),
      })
      .overrideProvider(SettingService)
      .useValue({
        checkRcStudent: jest.fn().mockImplementation(async () => {
          return false;
        }),
      })
      .overrideProvider(JwtStrategy)
      .useValue({
        validate: jest.fn().mockImplementation((payload: any) => {
          return payload;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get(UserService);
    jwtService = moduleFixture.get(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);

    // 데이터베이스를 완전히 삭제하고 다시 생성
    await dataSource.dropDatabase();
    await dataSource.synchronize(true);

    testUtils = new TestUtils(userService, jwtService);
    testUtils.setupMocks();

    await testUtils.initializeTestUsers();
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    if (testUtils) {
      testUtils.cleanup();
    }
    if (app) {
      await app.close();
    }
  });

  it('/whitebook [POST] 201', async () => {
    const Dto: WhitebookDto = {
      title: 'New Whitebook',
      content: 'Content of the new whitebook',
      link: 'https://www.example.com',
      show_only_login: false,
    };

    const postResponseByNonAdmin = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${testUtils.getTestUserJwtToken()}`])
      .send(Dto);
    expect(postResponseByNonAdmin.status).toBe(403);

    const postResponse = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .send(Dto);

    expect(postResponse.status).toBe(201);
    expect(postResponse.type).toBe('application/json');
    expect(postResponse.body).toEqual(
      expect.objectContaining({
        title: Dto.title,
        content: Dto.content,
        link: Dto.link,
        show_only_login: Dto.show_only_login,
      }),
    );
  });

  it('/whitebook [GET] 200', async () => {
    const getResponse = await request(app.getHttpServer()).get(`/whitebook`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.type).toBe('application/json');
    expect(Array.isArray(getResponse.body)).toBe(true);
  });

  it('/whitebook [POST] 201 - with pdf', async () => {
    const dtoWithPdfFile: WhitebookDto = {
      title: 'New Whitebook with PDF',
      content: 'Content of the new whitebook with PDF',
      show_only_login: false,
    };
    const pdf = new MemoryStoredFile();
    pdf.originalName = 'test.pdf';
    pdf.buffer = Buffer.from('test pdf buffer');

    const resWithPdf = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .attach('pdf_file', pdf.buffer, pdf.originalName)
      .field('title', dtoWithPdfFile.title)
      .field('content', dtoWithPdfFile.content)
      .field('show_only_login', dtoWithPdfFile.show_only_login);

    expect(resWithPdf.status).toBe(201);
    expect(resWithPdf.type).toBe('application/json');
    expect(resWithPdf.body).toEqual(
      expect.objectContaining({
        title: dtoWithPdfFile.title,
        content: dtoWithPdfFile.content,
        link: expect.stringContaining('whitebook'),
        show_only_login: dtoWithPdfFile.show_only_login,
      }),
    );
  });

  it('/whitebook/:id [Put] 200', async () => {
    const Dto: WhitebookDto = {
      title: 'New Whitebook',
      content: 'Content of the new whitebook',
      link: 'https://www.example.com',
      show_only_login: false,
    };

    const postResponse = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .send(Dto);

    expect(postResponse.status).toBe(201);
    expect(postResponse.type).toBe('application/json');

    const uuid = postResponse.body.uuid;

    const updateDataWithLink = {
      title: 'Updated Whitebook without PDF',
      content: 'Updated content of the whitebook without PDF',
      link: 'https://www.example.com/updated',
      show_only_login: false,
    };

    const putResponseByNonAdmin = await request(app.getHttpServer())
      .put(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${testUtils.getTestUserJwtToken()}`])
      .send(updateDataWithLink);
    expect(putResponseByNonAdmin.status).toBe(403);

    const putResponse = await request(app.getHttpServer())
      .put(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .send(updateDataWithLink);

    expect(putResponse.status).toBe(200);
    expect(putResponse.type).toBe('application/json');
    expect(putResponse.body).toEqual(
      expect.objectContaining({
        affected: 1,
      }),
    );

    const getResponse = await request(app.getHttpServer()).get(`/whitebook`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.type).toBe('application/json');
    expect(getResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: updateDataWithLink.title,
          content: updateDataWithLink.content,
          link: updateDataWithLink.link,
          show_only_login: updateDataWithLink.show_only_login,
        }),
      ]),
    );

    const updateDataWithPdf = {
      title: 'Updated Whitebook with PDF',
      content: 'Updated content of the whitebook with PDF',
      show_only_login: false,
    };
    const pdf = new MemoryStoredFile();
    pdf.originalName = 'test.pdf';
    pdf.buffer = Buffer.from('test pdf buffer');

    const putResponseWithPdf = await request(app.getHttpServer())
      .put(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .attach('pdf_file', pdf.buffer, pdf.originalName)
      .field('title', updateDataWithPdf.title)
      .field('content', updateDataWithPdf.content)
      .field('show_only_login', updateDataWithPdf.show_only_login);

    expect(putResponseWithPdf.status).toBe(200);
    expect(putResponseWithPdf.type).toBe('application/json');
    expect(putResponseWithPdf.body).toEqual(
      expect.objectContaining({
        affected: 1,
      }),
    );

    const getResponseAfterPdf = await request(app.getHttpServer()).get(
      `/whitebook`,
    );

    expect(getResponseAfterPdf.status).toBe(200);
    expect(getResponseAfterPdf.type).toBe('application/json');
    expect(getResponseAfterPdf.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: updateDataWithPdf.title,
          content: updateDataWithPdf.content,
          link: expect.stringContaining('whitebook'),
        }),
      ]),
    );
  });

  it('/whitebook/:id [DELETE] 200', async () => {
    const Dto: WhitebookDto = {
      title: 'New Whitebook',
      content: 'Content of the new whitebook',
      link: 'https://www.example.com',
      show_only_login: false,
    };

    const postRes = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`])
      .send(Dto);

    expect(postRes.status).toBe(201);
    expect(postRes.type).toBe('application/json');

    const uuid = postRes.body.uuid;

    const deleteResponseByNonAdmin = await request(app.getHttpServer())
      .delete(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${testUtils.getTestUserJwtToken()}`]);
    expect(deleteResponseByNonAdmin.status).toBe(403);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${testUtils.getTestAdminJwtToken()}`]);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.type).toBe('application/json');
    expect(deleteResponse.body).toEqual(
      expect.objectContaining({
        affected: 1,
      }),
    );

    const getResponse = await request(app.getHttpServer()).get(`/whitebook`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.type).toBe('application/json');
    expect(getResponse.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uuid: uuid,
        }),
      ]),
    );
  });
});
