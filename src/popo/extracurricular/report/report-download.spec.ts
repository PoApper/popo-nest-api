import { ExecutionContext, HttpException } from '@nestjs/common';
import { PassThrough, Readable } from 'stream';
import { Response } from 'express';
import { ActivityReportController } from './activity-report.controller';
import { ActivityReportService } from './activity-report.service';
import { ReportDownloadGuard } from './report-download.guard';

const response = () =>
  Object.assign(new PassThrough(), { setHeader: jest.fn() });
const context = (res: ReturnType<typeof response>) =>
  ({
    switchToHttp: () => ({ getResponse: () => res }),
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
