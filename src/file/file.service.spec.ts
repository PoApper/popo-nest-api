import { FileService } from './file.service';
import { MemoryStoredFile } from 'nestjs-form-data';
import { randomUUID } from 'crypto';

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
    } finally {
      await service.deleteFile(key);
    }
    await expect(service.getFile(key)).resolves.toEqual(Buffer.from(''));
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
