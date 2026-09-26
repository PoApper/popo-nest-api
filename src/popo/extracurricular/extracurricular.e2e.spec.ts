import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { FileService } from '../../file/file.service';
import { Activity } from './activity/activity.entity';
import { ActivityReport } from './report/activity-report.entity';
import { ExtracurricularModule } from './extracurricular.module';
import { UserType } from '../user/user.meta';
import { Readable } from 'stream';
import { ReportFileDeletion } from './report/report-file-deletion.entity';
import { ReportFileCleanupService } from './report/report-file-cleanup.service';
import { reportPdf } from './report/report-file.fixtures';

describe('Extracurricular CRUD', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const objects = new Map<string, Buffer>();
  const document = reportPdf;
  const files = {
    uploadFile: jest.fn(async (key, file) => {
      objects.set(key, file.buffer);
      return `https://files.example/${key}`;
    }),
    getFile: jest.fn(async (key) => objects.get(key)),
    getFileStream: jest.fn(async (key) => Readable.from([objects.get(key)])),
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
          entities: [Activity, ActivityReport, ReportFileDeletion],
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
      .attach('file', document, 'report.pdf');

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
      .expect('X-Content-Type-Options', 'nosniff')
      .expect(({ body }) => expect(body).toEqual(document));
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .field('memo', 'Updated memo')
      .expect(200)
      .expect(({ body }) => expect(body.fileKey).toBe(report.fileKey));
    const replacement = await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .attach('file', document, 'report.pdf')
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

  it('accepts a 20 MiB document and rejects files above the documented limit', async () => {
    const { body: parent } = await createActivity();
    const { body: report } = await createReport(parent.uuid).expect(201);
    const maximum = Buffer.alloc(20 * 1024 * 1024, ' ');
    document.copy(maximum);
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .attach('file', maximum, 'report.pdf')
      .expect(200);
    const uploads = files.uploadFile.mock.calls.length;
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .attach('file', Buffer.concat([maximum, Buffer.from(' ')]), 'report.pdf')
      .expect(400);
    expect(files.uploadFile).toHaveBeenCalledTimes(uploads);
  });

  it.each([
    ['report.html', '<html><script>alert(1)</script></html>'],
    ['report.svg', '<svg onload="alert(1)"></svg>'],
    ['report.pdf', '<html><script>alert(1)</script></html>'],
  ])('rejects active content uploaded as %s', async (filename, content) => {
    const { body: parent } = await createActivity();
    const { body: report } = await createReport(parent.uuid).expect(201);
    files.uploadFile.mockClear();
    await request(app.getHttpServer())
      .patch(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.staff)
      .attach('file', Buffer.from(content), {
        filename,
        contentType: 'text/html',
      })
      .expect(400);
    expect(files.uploadFile).not.toHaveBeenCalled();
    expect(objects.has(report.fileKey)).toBe(true);
  });

  it.each(['INSERT', 'UPDATE'])(
    'retries orphan cleanup after a report %s failure and storage outage',
    async (operation) => {
      const { body: parent } = await createActivity();
      const { body: report } = await createReport(parent.uuid).expect(201);
      await dataSource.query(
        `CREATE TRIGGER reject_report_write BEFORE ${operation} ON activity_report BEGIN SELECT RAISE(ABORT, 'write rejected'); END`,
      );
      files.deleteFile.mockRejectedValueOnce(new Error('storage unavailable'));
      try {
        const action =
          operation === 'INSERT'
            ? createReport(parent.uuid)
            : request(app.getHttpServer())
                .patch(`/activity-report/${report.uuid}`)
                .set('x-test-role', UserType.staff)
                .attach('file', document, 'report.pdf');
        await action.expect(500);
        const pending = await dataSource
          .getRepository(ReportFileDeletion)
          .find();
        expect(pending).toHaveLength(1);
        expect(pending[0].fileKey).not.toBe(report.fileKey);
        expect(objects.size).toBe(2);
        await app.get(ReportFileCleanupService).retry();
        expect(objects.size).toBe(1);
        expect(objects.has(report.fileKey)).toBe(true);
        expect(await dataSource.getRepository(ReportFileDeletion).count()).toBe(
          0,
        );
      } finally {
        await dataSource.query('DROP TRIGGER reject_report_write');
      }
    },
  );

  it('keeps a durable cleanup key when storage deletion fails and retries it', async () => {
    const { body: parent } = await createActivity();
    const { body: report } = await createReport(parent.uuid).expect(201);
    files.deleteFile.mockRejectedValueOnce(new Error('storage unavailable'));
    await request(app.getHttpServer())
      .delete(`/activity-report/${report.uuid}`)
      .set('x-test-role', UserType.admin)
      .expect(200);
    expect(await dataSource.getRepository(ActivityReport).count()).toBe(0);
    expect(objects.has(report.fileKey)).toBe(true);
    expect(await dataSource.getRepository(ReportFileDeletion).find()).toEqual([
      expect.objectContaining({ fileKey: report.fileKey }),
    ]);
    await app.get(ReportFileCleanupService).retry();
    expect(objects.has(report.fileKey)).toBe(false);
    expect(await dataSource.getRepository(ReportFileDeletion).count()).toBe(0);
  });

  it('rolls back the queued cleanup when the database rejects deletion', async () => {
    const { body: parent } = await createActivity();
    const { body: report } = await createReport(parent.uuid).expect(201);
    await dataSource.query(
      "CREATE TRIGGER reject_report_delete BEFORE DELETE ON activity_report BEGIN SELECT RAISE(ABORT, 'delete rejected'); END",
    );
    try {
      await request(app.getHttpServer())
        .delete(`/activity-report/${report.uuid}`)
        .set('x-test-role', UserType.admin)
        .expect(500);
      expect(await dataSource.getRepository(ActivityReport).count()).toBe(1);
      expect(await dataSource.getRepository(ReportFileDeletion).count()).toBe(
        0,
      );
      expect(objects.has(report.fileKey)).toBe(true);
      expect(files.deleteFile).not.toHaveBeenCalled();
    } finally {
      await dataSource.query('DROP TRIGGER reject_report_delete');
    }
  });

  it('does not let failing cleanup keys starve later entries', async () => {
    const repository = dataSource.getRepository(ReportFileDeletion);
    await repository.insert(
      Array.from({ length: 101 }, (_, i) => ({
        fileKey: `pending-${String(i).padStart(3, '0')}`,
      })),
    );
    const cleanup = app.get(ReportFileCleanupService);
    const remove = files.deleteFile.getMockImplementation();
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    files.deleteFile.mockRejectedValue(new Error('storage unavailable'));
    try {
      await cleanup.retry();
      expect(files.deleteFile).not.toHaveBeenCalledWith('pending-100');
      files.deleteFile.mockClear();
      files.deleteFile.mockImplementation(remove);
      await cleanup.retry();
      expect(files.deleteFile.mock.calls[0][0]).toBe('pending-100');
    } finally {
      files.deleteFile.mockImplementation(remove);
      log.mockRestore();
    }
  });

  it('cleans an upload when its activity has already been deleted', async () => {
    const { body: parent } = await createActivity();
    await request(app.getHttpServer())
      .delete(`/activity/${parent.uuid}`)
      .set('x-test-role', UserType.admin)
      .expect(200);
    await createReport(parent.uuid).expect(404);
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
