import { ExecutionContext, HttpException } from '@nestjs/common';
import { PassThrough, Readable } from 'stream';
import { Response } from 'express';
import { ActivityReportController } from './activity-report.controller';
import { ActivityReportService } from './activity-report.service';
import { ReportDownloadGuard } from './report-download.guard';
import * as express from 'express';
import * as request from 'supertest';

const response = () =>
  Object.assign(new PassThrough(), { setHeader: jest.fn() });
const context = (res: ReturnType<typeof response>, ip = '192.0.2.1') =>
  ({
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ ip }),
    }),
  }) as unknown as ExecutionContext;

describe('Report download limits', () => {
  it('rejects excess concurrent requests and releases disconnected/finished slots once', () => {
    const guard = new ReportDownloadGuard();
    const responses = Array.from({ length: 32 }, response);
    for (const res of responses)
      expect(guard.canActivate(context(res))).toBe(true);
    expect(() => guard.canActivate(context(response()))).toThrow(HttpException);
    responses[0].emit('close');
    responses[0].emit('finish');
    expect(guard.canActivate(context(response()))).toBe(true);
    expect(() => guard.canActivate(context(response()))).toThrow(HttpException);
  });

  it('limits repeated requests even when each response completes, then resets the window', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    try {
      const guard = new ReportDownloadGuard();
      for (let i = 0; i < 600; i++) {
        const res = response();
        guard.canActivate(context(res));
        res.emit('finish');
      }
      expect(() => guard.canActivate(context(response()))).toThrow(
        HttpException,
      );
      now.mockReturnValue(61_001);
      expect(guard.canActivate(context(response()))).toBe(true);
    } finally {
      now.mockRestore();
    }
  });

  it('does not share concurrency limits between clients', () => {
    const guard = new ReportDownloadGuard();
    const responses = Array.from({ length: 32 }, response);
    for (const res of responses) guard.canActivate(context(res, '192.0.2.1'));
    expect(() => guard.canActivate(context(response(), '192.0.2.1'))).toThrow(
      HttpException,
    );
    expect(guard.canActivate(context(response(), '198.51.100.1'))).toBe(true);
    for (const res of responses) res.emit('finish');
  });

  it('does not share request quotas between clients', () => {
    const guard = new ReportDownloadGuard();
    for (let i = 0; i < 600; i++) {
      const res = response();
      guard.canActivate(context(res, '192.0.2.1'));
      res.emit('finish');
    }
    const rejected = response();
    expect(() => guard.canActivate(context(rejected, '192.0.2.1'))).toThrow(
      HttpException,
    );
    expect(rejected.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    expect(guard.canActivate(context(response(), '198.51.100.1'))).toBe(true);
  });

  it('retains active slots across a window reset and expires idle clients', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    try {
      const guard = new ReportDownloadGuard();
      const responses = Array.from({ length: 32 }, response);
      for (const res of responses) guard.canActivate(context(res));
      const idle = response();
      guard.canActivate(context(idle, '198.51.100.1'));
      idle.emit('finish');
      now.mockReturnValue(61_001);
      expect(() => guard.canActivate(context(response()))).toThrow(
        HttpException,
      );
      expect(guard['clients'].has('198.51.100.1')).toBe(false);
      for (const res of responses) res.emit('close');
      expect(guard.canActivate(context(response()))).toBe(true);
    } finally {
      now.mockRestore();
    }
  });

  it.each([
    [false, ['198.51.100.1', '198.51.100.2'], false],
    ['loopback', ['198.51.100.1', '198.51.100.2'], true],
    ['loopback', ['192.0.2.1, 198.51.100.1', '192.0.2.2, 198.51.100.1'], false],
  ])(
    'respects proxy trust %s without trusting spoofed addresses',
    async (trust, ips, separate) => {
      const app = express();
      app.set('trust proxy', trust);
      const guard = new ReportDownloadGuard();
      app.get('/', (req, res) => {
        const ctx = {
          switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
          }),
        } as unknown as ExecutionContext;
        try {
          guard.canActivate(ctx);
          // Exhaust the resolved client's quota without 600 HTTP round trips.
          guard['clients'].get(req.ip).count = 600;
          res.sendStatus(200);
        } catch (error) {
          res.sendStatus((error as HttpException).getStatus());
        }
      });
      await request(app).get('/').set('X-Forwarded-For', ips[0]).expect(200);
      await request(app)
        .get('/')
        .set('X-Forwarded-For', ips[1])
        .expect(separate ? 200 : 429);
    },
  );
});

describe('Report streaming', () => {
  const download = (source: Readable, res: ReturnType<typeof response>) => {
    const controller = new ActivityReportController({
      getFileStream: jest.fn().mockResolvedValue({
        stream: source,
        fileName: 'report.pdf',
        fileType: 'pdf',
      }),
    } as unknown as ActivityReportService);
    return controller.downloadFile('id', res as unknown as Response);
  };

  it('propagates backpressure and closes storage reads when the client disconnects', async () => {
    let produced = 0;
    const source = new Readable({
      read() {
        produced++;
        this.push(Buffer.alloc(64 * 1024));
      },
    });
    const res = response();
    const pending = download(source, res);
    await new Promise((resolve) => setImmediate(resolve));
    expect(produced).toBeLessThan(10);
    res.destroy();
    await pending;
    expect(source.destroyed).toBe(true);
  });

  it('destroys the response when storage fails mid-stream', async () => {
    const source = new Readable({
      read() {
        this.destroy(new Error('storage failure'));
      },
    });
    const res = response();
    await download(source, res);
    expect(source.destroyed).toBe(true);
    expect(res.destroyed).toBe(true);
  });
});
