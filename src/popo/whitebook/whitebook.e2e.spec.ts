import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { WhitebookDto } from './whitebook.dto';
import { DataSource } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileService } from 'src/file/file.service';

describe('WhitebookController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FileService)
      .useValue({
        uploadFile: jest.fn().mockImplementation(async (key: string) => {
          return `${process.env.S3_CF_DIST_URL}/${key}`;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
      .send(Dto);

    expect(postRes.status).toBe(201);
    expect(postRes.type).toBe('application/json');

    const uuid = postRes.body.uuid;

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/whitebook/${uuid}`,
    );

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
