import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { WhitebookDto } from './whitebook.dto';
import { DataSource } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileService } from 'src/file/file.service';
import { UserType } from '../user/user.meta';
import { UserService } from '../user/user.service';
import { SettingService } from '../setting/setting.service';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { AppModule } from 'src/app.module';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const JWT_SECRET = 'SECRET';
const EXPIRATION_TIME = '1h';

describe('WhitebookController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let jwtService: JwtService;
  let adminUser: User;
  let testUser: User;
  let adminUserJwtToken: string;
  let testUserJwtToken: string;

  beforeAll(async () => {
    // AuthGuard mock 설정
    const parentCanActivateSpy = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        // 이렇게 생김
        // console.log('request.headers: ', request.headers);
        // request.headers:  {
        //   host: '127.0.0.1:62986',
        //   'accept-encoding': 'gzip, deflate',
        //   cookie: 'Authentication=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiM2E5NjIxN2MtMzJmYy00NjgzLWJiNmYtNmI0OGNiYjBmYjFjIiwibmFtZSI6ImFkbWluIiwibmlja25hbWUiOiIiLCJ1c2VyVHlwZSI6IkFETUlOIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsImlhdCI6MTc1MzQ1Nzk2OSwiZXhwIjoxNzUzNDYxNTY5fQ.oprOrhCRhwkx2m08fEbdW6xDnYQrKsAuusTx4SwEhp4',
        //   'content-type': 'application/json',
        //   'content-length': '123',
        //   connection: 'close'
        // }

        const cookie = request.headers?.cookie as string;
        let token = '';

        if (cookie && cookie.includes('Authentication=')) {
          token = cookie.split('Authentication=')[1];
        }

        if (!token) return false;

        try {
          const jwtService = new JwtService({
            secret: JWT_SECRET,
          });
          const decoded = jwtService.verify(token, {
            secret: JWT_SECRET,
          });

          request.user = decoded;
          return true;
        } catch (error) {
          console.log('JWT decode error:', error);
          return false;
        }
      });

    // // RolesGuard mock 설정
    // const rolesGuardSpy = jest
    //   .spyOn(
    //     require('../../auth/authroization/roles.guard').RolesGuard.prototype,
    //     'canActivate',
    //   )
    //   .mockImplementation((context: ExecutionContext) => {
    //     const request = context.switchToHttp().getRequest();
    //     const user = request.user;

    //     console.log('Mocked RolesGuard canActivate: ', user);

    //     if (!user) return false;

    //     const handler = context.getHandler();
    //     const roles = Reflect.getMetadata('roles', handler);

    //     console.log('Mocked RolesGuard Debug:', {
    //       user: user,
    //       roles: roles,
    //       userType: user.userType,
    //       hasAdminRole: roles && roles.includes(UserType.admin),
    //     });

    //     if (roles && roles.includes(UserType.admin)) {
    //       return user.userType === UserType.admin;
    //     }

    //     return true;
    //   });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
      .compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get(UserService);
    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    testUser = await userService.save({
      email: 'test@test.com',
      password: 'test',
      name: 'test',
      userType: UserType.student,
    });

    adminUser = await userService.save({
      email: 'admin@test.com',
      password: 'test',
      name: 'admin',
      userType: UserType.admin,
    });

    // Admin JWT 토큰 생성
    const adminPayload: JwtPayload = {
      uuid: adminUser.uuid,
      name: adminUser.name,
      nickname: '',
      userType: adminUser.userType,
      email: adminUser.email,
    };

    adminUserJwtToken = jwtService.sign(adminPayload, {
      expiresIn: EXPIRATION_TIME,
      secret: JWT_SECRET,
    });

    const testPayload: JwtPayload = {
      uuid: testUser.uuid,
      name: testUser.name,
      nickname: '',
      userType: testUser.userType,
      email: testUser.email,
    };

    testUserJwtToken = jwtService.sign(testPayload, {
      expiresIn: EXPIRATION_TIME,
      secret: JWT_SECRET,
    });
  });

  afterEach(async () => {
    // 각 테스트 끝날 때마다 DB 초기화
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/whitebook [GET] 200', async () => {
    const Dto: WhitebookDto = {
      title: 'New Whitebook',
      content: 'Content of the new whitebook',
      link: 'https://www.example.com',
      show_only_login: false,
    };

    const postResponse = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
      .send(Dto);

    expect(postResponse.status).toBe(201);
    expect(postResponse.type).toBe('application/json');

    const createdUuid = postResponse.body.uuid;
    const res = await request(app.getHttpServer()).get(`/whitebook`);

    expect(res.status).toBe(200);
    expect(res.type).toBe('application/json');
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uuid: createdUuid,
          title: Dto.title,
          content: Dto.content,
          link: Dto.link,
          show_only_login: Dto.show_only_login,
        }),
      ]),
    );
  });

  it('/whitebook [POST] 201', async () => {
    // PDF 파일 없이 생성
    const dtoWithoutPdfFile: WhitebookDto = {
      title: 'New Whitebook',
      content: 'Content of the new whitebook',
      link: 'https://www.example.com',
      show_only_login: true,
    };

    const resWihtoutPDF = await request(app.getHttpServer())
      .post('/whitebook')
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
      .send(dtoWithoutPdfFile);

    expect(resWihtoutPDF.status).toBe(201);
    expect(resWihtoutPDF.type).toBe('application/json');
    expect(resWihtoutPDF.body).toEqual(
      expect.objectContaining({
        title: dtoWithoutPdfFile.title,
        content: dtoWithoutPdfFile.content,
        link: dtoWithoutPdfFile.link,
        show_only_login: dtoWithoutPdfFile.show_only_login,
      }),
    );

    // PDF 파일로 생성
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
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
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
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
      .send(Dto);

    expect(postResponse.status).toBe(201);
    expect(postResponse.type).toBe('application/json');

    const uuid = postResponse.body.uuid;

    // PDF 파일 없이 업데이트
    const updateDataWithLink = {
      title: 'Updated Whitebook without PDF',
      content: 'Updated content of the whitebook without PDF',
      link: 'https://www.example.com/updated',
      show_only_login: false,
    };

    const putResponse = await request(app.getHttpServer())
      .put(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
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

    // PDF 파일로 업데이트
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
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
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
      .set('Cookie', [`Authentication=${adminUserJwtToken}`])
      .send(Dto);

    expect(postRes.status).toBe(201);
    expect(postRes.type).toBe('application/json');

    const uuid = postRes.body.uuid;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/whitebook/${uuid}`)
      .set('Cookie', [`Authentication=${adminUserJwtToken}`]);

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
