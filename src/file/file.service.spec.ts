import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileService } from './file.service';
import { FileSystemStoredFile, MemoryStoredFile } from 'nestjs-form-data';
import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

describe('FileService environment configuration', () => {
  const previous = { ...process.env };
  beforeEach(() => {
    delete process.env.S3_REGION;
    delete process.env.S3_BUCKET_NAME;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });
  afterEach(() => {
    process.env = { ...previous };
  });

  it.each(['dev', 'prod', 'development', 'production'])(
    'fails startup without S3 in %s',
    (environment) => {
      process.env.NODE_ENV = environment;
      expect(() => new FileService()).toThrow(
        'S3_REGION and S3_BUCKET_NAME are required',
      );
    },
  );

  it('accepts deployed S3 configuration with IAM role credentials', () => {
    process.env.NODE_ENV = 'prod';
    process.env.S3_REGION = 'ap-northeast-2';
    process.env.S3_BUCKET_NAME = 'reports';
    expect(() => new FileService()).not.toThrow();
  });

  it('returns the unconsumed S3 stream without collecting object chunks', async () => {
    process.env.NODE_ENV = 'prod';
    process.env.S3_REGION = 'ap-northeast-2';
    process.env.S3_BUCKET_NAME = 'reports';
    const read = jest.fn();
    const stream = new Readable({ read });
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(async () => ({ Body: stream }));
    try {
      expect(await new FileService().getFileStream('report.pdf')).toBe(stream);
      expect(read).not.toHaveBeenCalled();
    } finally {
      send.mockRestore();
      stream.destroy();
    }
  });

  it('persists and removes bytes only in local mode', async () => {
    process.env.NODE_ENV = 'local';
    const service = new FileService();
    const key = `file-service-test-${randomUUID()}.pdf`;
    const file = Object.assign(new MemoryStoredFile(), {
      buffer: Buffer.from('report'),
    });
    try {
      await expect(service.uploadFile(key, file)).resolves.toBe(
        `local://${key}`,
      );
      await expect(service.getFile(key)).resolves.toEqual(file.buffer);
      const stream = await service.getFileStream(key);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      expect(Buffer.concat(chunks)).toEqual(file.buffer);
    } finally {
      await service.deleteFile(key);
    }
    await expect(service.getFile(key)).resolves.toEqual(Buffer.from(''));
  });

  it('sends server-provided document metadata to S3 instead of multipart MIME', async () => {
    process.env.NODE_ENV = 'prod';
    process.env.S3_REGION = 'ap-northeast-2';
    process.env.S3_BUCKET_NAME = 'reports';
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(async () => ({}));
    try {
      const file = Object.assign(new MemoryStoredFile(), {
        buffer: Buffer.from('report'),
        busBoyMimeType: 'text/html',
      });
      await new FileService().uploadFile('activity-report/id/file', file, {
        contentType: 'application/pdf',
        contentDisposition: 'attachment',
      });
      const command = send.mock.calls[0][0] as PutObjectCommand;
      expect(command.input).toMatchObject({
        ContentType: 'application/pdf',
        ContentDisposition: 'attachment',
      });
    } finally {
      send.mockRestore();
    }
  });

  it.each([false, true])(
    'streams disk uploads to S3 and closes them on failure=%s',
    async (fail) => {
      process.env.NODE_ENV = 'prod';
      process.env.S3_REGION = 'ap-northeast-2';
      process.env.S3_BUCKET_NAME = 'reports';
      const directory = await mkdtemp(join(tmpdir(), 'file-service-test-'));
      const content = Buffer.from('report');
      const file = Object.assign(new FileSystemStoredFile(), {
        path: join(directory, 'report.pdf'),
        size: content.length,
      });
      await writeFile(file.path, content);
      let stream: Readable;
      const send = jest
        .spyOn(S3Client.prototype, 'send')
        .mockImplementation(async (command: PutObjectCommand) => {
          stream = command.input.Body as Readable;
          expect(stream).toBeInstanceOf(Readable);
          expect(command.input.ContentLength).toBe(content.length);
          if (fail) throw new Error('S3 unavailable');
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          expect(Buffer.concat(chunks)).toEqual(content);
          return {};
        });
      try {
        const upload = new FileService().uploadFile('report', file);
        if (fail) await expect(upload).rejects.toThrow('S3 unavailable');
        else await upload;
        expect(stream.destroyed).toBe(true);
        // Wait for the underlying descriptor to close before deleting the fixture.
        if (!stream.closed)
          await new Promise((resolve) => stream.once('close', resolve));
      } finally {
        send.mockRestore();
        await rm(directory, { recursive: true, force: true });
      }
    },
  );

  it('copies spooled files to local storage without collecting their bytes', async () => {
    process.env.NODE_ENV = 'local';
    const directory = await mkdtemp(join(tmpdir(), 'file-service-test-'));
    const file = Object.assign(new FileSystemStoredFile(), {
      path: join(directory, 'report.pdf'),
      size: 6,
    });
    await writeFile(file.path, 'report');
    const key = `file-service-test-${randomUUID()}.pdf`;
    const service = new FileService();
    try {
      await service.uploadFile(key, file);
      expect(await service.getFile(key)).toEqual(Buffer.from('report'));
    } finally {
      await service.deleteFile(key);
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects traversal including a sibling with the uploads prefix', async () => {
    process.env.NODE_ENV = 'local';
    const service = new FileService();
    await expect(
      service.getFile('../uploads-other/private.csv'),
    ).rejects.toThrow('Invalid file key');
  });

  it('does not use the local filesystem in test mode', async () => {
    process.env.NODE_ENV = 'test';
    await expect(new FileService().getFile('report.pdf')).rejects.toThrow(
      'only available in the local environment',
    );
  });
});
