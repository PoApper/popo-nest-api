import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { access, mkdtemp, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import * as os from 'os';
import { join } from 'path';
import { request as httpRequest } from 'http';
import { AddressInfo } from 'net';
import * as request from 'supertest';
import { ActivityReportController } from './activity-report.controller';
import { ActivityReportService } from './activity-report.service';
import { ReportUploadInterceptor } from './report-upload.interceptor';
import { ReportDownloadGuard } from './report-download.guard';
import { UserType } from '../../user/user.meta';
import { reportPdf } from './report-file.fixtures';

describe('Report upload admission and temporary storage', () => {
  let app: INestApplication;
  let interceptor: ReportUploadInterceptor;
  let directory: string;
  let temporaryRoot: jest.SpyInstance;
  const update = jest.fn();
  const waitFor = async (condition: () => boolean | Promise<boolean>) => {
    for (let i = 0; i < 200; i++) {
      if (await condition()) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Condition did not become true');
  };
  const upload = (principal = 'staff') =>
    request(app.getHttpServer())
      .patch('/activity-report/report')
      .set('x-test-user', principal)
      .attach('file', reportPdf, 'report.pdf');

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'report-upload-test-'));
    temporaryRoot = jest.spyOn(os, 'tmpdir').mockReturnValue(directory);
    const module = await Test.createTestingModule({
      controllers: [ActivityReportController],
      providers: [
        ReportUploadInterceptor,
        ReportDownloadGuard,
        { provide: ActivityReportService, useValue: { update } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use((req, _res, next) => {
      req.user = {
        uuid: req.headers['x-test-user'] ?? 'staff',
        userType: UserType.staff,
      };
      next();
    });
    await app.listen(0, '127.0.0.1');
    interceptor = app.get(ReportUploadInterceptor);
  });
  beforeEach(() => update.mockReset().mockResolvedValue({}));
  afterEach(async () => {
    expect(interceptor['total']).toBe(0);
    expect(interceptor['active'].size).toBe(0);
    expect(await readdir(directory)).toEqual([]);
  });
  afterAll(async () => {
    await app?.close();
    temporaryRoot?.mockRestore();
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it('holds per-account slots through storage I/O without blocking other accounts', async () => {
    let release: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const paths: string[] = [];
    update.mockImplementation(async (_id, dto) => {
      paths.push(dto.file.path);
      await pending;
      return {};
    });
    const first = upload().then((response) => response);
    const second = upload().then((response) => response);
    try {
      await waitFor(() => paths.length === 2);
      await upload().expect(429);
      update.mockResolvedValueOnce({});
      await upload('another-staff').expect(200);
      expect(update).toHaveBeenCalledTimes(3);
    } finally {
      release();
      expect((await first).status).toBe(200);
      expect((await second).status).toBe(200);
    }
    for (const path of paths) await expect(access(path)).rejects.toThrow();
    await upload().expect(200);
  });

  it('caps aggregate uploads even when each principal is different', async () => {
    let release: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    update.mockImplementation(async () => {
      await pending;
      return {};
    });
    const uploads = Array.from({ length: 16 }, (_, i) =>
      upload(`staff-${i}`).then((res) => res),
    );
    try {
      await waitFor(() => update.mock.calls.length === 16);
      await upload('overflow').expect(429);
    } finally {
      release();
      expect(
        (await Promise.all(uploads)).every((res) => res.status === 200),
      ).toBe(true);
    }
  });

  it('removes spooled files and releases slots after handler failure', async () => {
    let path: string;
    update.mockImplementationOnce(async (_id, dto) => {
      path = dto.file.path;
      throw new Error('storage failed');
    });
    await upload().expect(500);
    await expect(access(path)).rejects.toThrow();
    await upload().expect(200);
  });

  it('rejects multiple files and oversized metadata before invoking the handler', async () => {
    await upload().attach('file', reportPdf, 'second.pdf').expect(400);
    await upload()
      .field('memo', 'x'.repeat(64 * 1024 + 1))
      .expect(400);
    await upload().field('file', 'shadow').expect(400);
    expect(update).not.toHaveBeenCalled();
    await upload().expect(200);
  });

  it('cleans partial files and admission slots when a client disconnects', async () => {
    const before = new Set(await readdir(tmpdir()));
    const address = app.getHttpServer().address() as AddressInfo;
    const client = httpRequest({
      host: '127.0.0.1',
      port: address.port,
      path: '/activity-report/report',
      method: 'PATCH',
      headers: {
        'content-type': 'multipart/form-data; boundary=test-boundary',
      },
    });
    client.on('error', () => undefined);
    client.write(
      '--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="report.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
    );
    client.write(reportPdf);
    try {
      await waitFor(async () => {
        const dirs = (await readdir(tmpdir())).filter(
          (name) => name.startsWith('popo-report-') && !before.has(name),
        );
        return (
          dirs.length > 0 &&
          (await readdir(`${tmpdir()}/${dirs[0]}`)).includes('document')
        );
      });
    } finally {
      client.destroy();
    }
    await waitFor(() => interceptor['total'] === 0);
    const remaining = (await readdir(tmpdir())).filter(
      (name) => name.startsWith('popo-report-') && !before.has(name),
    );
    expect(remaining).toEqual([]);
    expect(update).not.toHaveBeenCalled();
    await upload().expect(200);
  });
});
