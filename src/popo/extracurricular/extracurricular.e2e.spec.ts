import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { FileService } from '../../file/file.service';
import { Activity } from './activity/activity.entity';
import { ActivityReport } from './report/activity-report.entity';
import { ExtracurricularModule } from './extracurricular.module';
import { UserType } from '../user/user.meta';

describe('Extracurricular CRUD', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const objects = new Map<string, Buffer>();
  const files = {
    uploadFile: jest.fn(async (key, file) => {
      objects.set(key, file.buffer);
      return `https://files.example/${key}`;
    }),
    getFile: jest.fn(async (key) => objects.get(key)),
    deleteFile: jest.fn(async (key) => {
      objects.delete(key);
    }),
  };
  const activity = {
    title: 'Culture tour',
    period: '2026',
    target: 'Students',
    applicationMethod: 'Online',
    description: 'Explore',
    category: 'Culture',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Activity, ActivityReport],
          synchronize: true,
        }),
        ExtracurricularModule,
      ],
    })
      .overrideProvider(FileService)
      .useValue(files)
      .compile();
    app = module.createNestApplication();
    app.use((req, _res, next) => {
      req.user = { userType: req.headers['x-test-role'] || '' };
      next();
    });
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    objects.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  const createActivity = () =>
    request(app.getHttpServer())
      .post('/activity')
      .set('x-test-role', UserType.admin)
      .send(activity);

  const createReport = (activityId: string) =>
    request(app.getHttpServer())
      .post('/activity-report')
      .set('x-test-role', UserType.staff)
      .field('activityId', activityId)
      .field('title', 'My report')
      .field('period', '2026')
      .field('grade', '3')
      .field('major', 'CSE')
      .field('author', 'Student')
      .attach('file', Buffer.from('document'), 'report.pdf');

  it('creates, filters, reads, updates and deletes activities', async () => {
    const created = await createActivity().expect(201);
    const id = created.body.uuid;
    expect(created.body.iconName).toBe('BookOpen');
    await request(app.getHttpServer())
      .get('/activity?category=Culture')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app.getHttpServer())
      .get('/activity?category=Other')
      .expect(200, []);
    await request(app.getHttpServer())
      .get(`/activity/${id}`)
      .expect(200)
      .expect(({ body }) => expect(body.title).toBe(activity.title));
    await request(app.getHttpServer())
      .patch(`/activity/${id}`)
      .set('x-test-role', UserType.staff)
      .send({ title: 'Updated' })
      .expect(200)
      .expect(({ body }) => expect(body.title).toBe('Updated'));
    await request(app.getHttpServer())
      .delete(`/activity/${id}`)
      .set('x-test-role', UserType.admin)
      .expect(200);
    await request(app.getHttpServer()).get('/activity').expect(200, []);
  });

  it('creates, filters, reads, streams, replaces and deletes reports', async () => {
    const { body: parent } = await createActivity();
    const { body: report } = await createReport(parent.uuid).expect(201);
    await request(app.getHttpServer())
      .get(`/activity-report?activityId=${parent.uuid}&period=2026&major=CSE`)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app.getHttpServer())
      .get('/activity-report?major=Other')
      .expect(200, []);
    await request(app.getHttpServer())
      .get(`/activity-report/${report.uuid}`)
      .expect(200)
      .expect(({ body }) => expect(body.fileName).toBe('report.pdf'));
    await request(app.getHttpServer())
      .get(`/activity-report/${report.uuid}/file`)
      .expect('Content-Type', /application\/pdf/)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(Buffer.from('document')));
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .field('memo', 'Updated memo')
      .expect(200)
      .expect(({ body }) => expect(body.fileKey).toBe(report.fileKey));
    const replacement = await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .attach('file', Buffer.from('replacement'), 'report.pdf')
      .expect(200);
    expect(replacement.body.fileKey).not.toBe(report.fileKey);
    expect(objects.has(report.fileKey)).toBe(false);
    await request(app.getHttpServer())
      .delete(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.admin)
      .expect(200);
    expect(objects.size).toBe(0);
    await request(app.getHttpServer()).get('/activity-report').expect(200, []);
    await request(app.getHttpServer())
      .get(`/activity-report/${report.uuid}/file`)
      .expect(404);
  });

  it('cleans all attachments when deleting their activity', async () => {
    const { body: parent } = await createActivity();
    await createReport(parent.uuid).expect(201);
    await createReport(parent.uuid).expect(201);
    expect(objects.size).toBe(2);
    await request(app.getHttpServer())
      .delete(`/activity/${parent.uuid}`)
      .set('x-test-role', UserType.admin)
      .expect(200);
    expect(objects.size).toBe(0);
    expect(await dataSource.getRepository(ActivityReport).count()).toBe(0);
  });

  it('rejects nonstaff writes, missing fields and storage metadata injection', async () => {
    await request(app.getHttpServer())
      .post('/activity')
      .send(activity)
      .expect(403);
    await request(app.getHttpServer())
      .post('/activity')
      .set('x-test-role', UserType.admin)
      .send({})
      .expect(400);
    const { body: parent } = await createActivity();
    await createReport(parent.uuid).field('fileKey', 'private.csv').expect(400);
    expect(files.uploadFile).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post('/activity-report')
      .set('x-test-role', UserType.staff)
      .field('activityId', parent.uuid)
      .field('title', 'Missing file')
      .expect(400);
    const { body: report } = await createReport(parent.uuid).expect(201);
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .field('fileKey', 'private.csv')
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .field('memo', 'unauthorized')
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/activity-report/${report.uuid}`)
      .expect(403);
    expect(
      (
        await dataSource
          .getRepository(ActivityReport)
          .findOneBy({ uuid: report.uuid })
      ).fileKey,
    ).toBe(report.fileKey);
  });
});
