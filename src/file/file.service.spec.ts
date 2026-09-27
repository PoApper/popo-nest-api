import { FileService } from './file.service';
import { MemoryStoredFile } from 'nestjs-form-data';
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
