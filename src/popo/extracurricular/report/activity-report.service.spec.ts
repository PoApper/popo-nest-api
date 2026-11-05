import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { EntityManager, FindOperator, Repository } from 'typeorm';
import { FileSystemStoredFile } from 'nestjs-form-data';
import { ActivityReportService } from './activity-report.service';
import { ActivityReport } from './activity-report.entity';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileService } from '../../../file/file.service';
import { ReportFileCleanupService } from './report-file-cleanup.service';
import { ReportFileDeletion } from './report-file-deletion.entity';
import { reportPdf } from './report-file.fixtures';

describe('ActivityReportService storage consistency', () => {
  const existing = {
    uuid: 'report',
    activityId: 'activity',
    fileKey: 'old-key',
  };
  const file = Object.assign(new FileSystemStoredFile(), {
    originalName: 'report.pdf',
    size: reportPdf.length,
  });
  let directory: string;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'report-service-test-'));
    file.path = join(directory, 'report.pdf');
    await writeFile(file.path, reportPdf);
    await writeFile(
      join(directory, 'dangerous'),
      '<html><script>alert(1)</script></html>',
    );
  });
  afterAll(async () => rm(directory, { recursive: true, force: true }));
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    manager: Record<string, jest.Mock>;
  };
  let files: { uploadFile: jest.Mock; deleteFile: jest.Mock };
  let service: ActivityReportService;
  let pending: Map<string, ReportFileDeletion>;
  let cleanup: ReportFileCleanupService;
  let now: jest.SpyInstance;
  const retryExpired = async () => {
    now.mockReturnValue(Date.now() + 16 * 60_000);
    await cleanup.retry();
  };
  afterEach(() => now.mockRestore());
  beforeEach(() => {
    now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    pending = new Map();
    repository = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn(async (dto) => dto),
      findOne: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn().mockResolvedValue(existing),
      manager: undefined,
    };
    files = {
      uploadFile: jest.fn().mockResolvedValue('https://file'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const builder: Record<string, jest.Mock> = {};
    for (const method of ['update', 'set', 'where'])
      builder[method] = jest.fn(() => builder);
    builder.execute = jest.fn();
    const manager = {
      connection: { options: { type: 'mariadb' } },
      createQueryBuilder: jest.fn(() => builder),
      findOneBy: jest.fn().mockResolvedValue(existing),
      findBy: jest.fn().mockResolvedValue([existing]),
      findOne: jest.fn(
        async (_entity, options) => pending.get(options.where.fileKey) ?? null,
      ),
      getRepository: jest.fn(() => repository),
      insert: jest.fn(async (_entity, value) =>
        pending.set(value.fileKey, {
          cleanupAfter: 0,
          lastAttemptAt: 0,
          ...value,
        }),
      ),
      delete: jest.fn(async (entity, criteria) =>
        entity === ReportFileDeletion
          ? pending.delete(criteria.fileKey)
          : repository.delete(criteria),
      ),
      transaction: undefined,
    };
    manager.transaction = jest.fn(async (callback) => {
      const before = new Map(pending);
      try {
        return await callback(manager);
      } catch (error) {
        pending = before;
        throw error;
      }
    });
    repository.manager = manager as unknown as Record<string, jest.Mock>;
    cleanup = new ReportFileCleanupService(
      {
        find: jest.fn(
          async (options: { where: { cleanupAfter: FindOperator<number> } }) =>
            [...pending.values()].filter(
              (value) => value.cleanupAfter <= options.where.cleanupAfter.value,
            ),
        ),
        update: jest.fn(async ({ fileKey }, patch) => {
          const intent = pending.get(fileKey);
          if (intent) Object.assign(intent, patch);
        }),
        manager: manager as unknown as EntityManager,
      } as unknown as Repository<ReportFileDeletion>,
      files as unknown as FileService,
    );
    service = new ActivityReportService(
      repository as unknown as Repository<ActivityReport>,
      files as unknown as FileService,
    );
  });

  it('never persists caller supplied file fields on create or update', async () => {
    await service.create({
      activityId: 'activity',
      title: 'report',
      period: '2026',
      grade: '3',
      major: 'CSE',
      author: 'student',
      file,
      fileKey: 'private.csv',
      fileName: 'private.csv',
      fileType: 'csv',
    } as CreateActivityReportDto);
    expect(repository.create.mock.calls[0][0]).not.toHaveProperty('fileKey');
    expect(repository.save.mock.calls[0][0].fileKey).toMatch(
      /^activity-report\/activity\//,
    );
    await service.update('report', {
      title: 'new',
      fileKey: 'private.csv',
      fileUrl: 'private',
    } as UpdateActivityReportDto);
    expect(repository.update).toHaveBeenLastCalledWith(
      { uuid: 'report' },
      { title: 'new' },
    );
  });

  it('queues a newly uploaded file and preserves the old one if DB update fails', async () => {
    const error = new Error('database unavailable');
    repository.update.mockRejectedValue(error);
    await expect(service.update('report', { file })).rejects.toBe(error);
    const newKey = files.uploadFile.mock.calls[0][0];
    expect(files.deleteFile).not.toHaveBeenCalled();
    await retryExpired();
    expect(files.deleteFile).toHaveBeenCalledTimes(1);
    expect(files.deleteFile).toHaveBeenCalledWith(newKey);
    expect(files.deleteFile).not.toHaveBeenCalledWith('old-key');
  });

  it('cleans the upload if report creation fails', async () => {
    repository.save.mockRejectedValue(new Error('insert failed'));
    await expect(
      service.create({
        activityId: 'activity',
        title: 'report',
        period: '2026',
        grade: '3',
        major: 'CSE',
        author: 'student',
        file,
      }),
    ).rejects.toThrow('insert failed');
    expect(files.deleteFile).not.toHaveBeenCalled();
    await retryExpired();
    expect(files.deleteFile).toHaveBeenCalledWith(
      files.uploadFile.mock.calls[0][0],
    );
  });

  it('keeps the old object until the database update succeeds', async () => {
    repository.update.mockImplementation(async () => {
      expect(files.deleteFile).not.toHaveBeenCalled();
    });
    await service.update('report', { file });
    expect(files.deleteFile).not.toHaveBeenCalled();
    await cleanup.retry();
    expect(files.deleteFile).toHaveBeenCalledWith('old-key');
  });

  it('does not update the database when uploading fails', async () => {
    files.uploadFile.mockRejectedValue(new Error('upload failed'));
    await expect(service.update('report', { file })).rejects.toThrow(
      'upload failed',
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(pending.size).toBe(1);
    await retryExpired();
    expect(pending.size).toBe(0);
  });

  it.each(['create', 'update'] as const)(
    'keeps a durable intent if %s and compensating storage deletion both fail',
    async (operation) => {
      repository.save.mockRejectedValue(new Error('database unavailable'));
      repository.update.mockRejectedValue(new Error('database unavailable'));
      files.deleteFile.mockRejectedValue(new Error('storage unavailable'));
      const dto = { activityId: 'activity', file } as CreateActivityReportDto;
      await expect(
        operation === 'create'
          ? service.create(dto)
          : service.update('report', dto),
      ).rejects.toThrow('database unavailable');
      await retryExpired();
      expect([...pending.keys()]).toEqual([files.uploadFile.mock.calls[0][0]]);
      expect(pending.has('old-key')).toBe(false);
    },
  );

  it('does not upload when the database cannot persist a cleanup intent', async () => {
    repository.manager.insert.mockRejectedValue(new Error('database offline'));
    await expect(service.update('report', { file })).rejects.toThrow(
      'database offline',
    );
    expect(files.uploadFile).not.toHaveBeenCalled();
  });

  it('does not upload if a cleanup worker already claimed the intent', async () => {
    repository.manager.findOne.mockResolvedValue(null);
    await expect(service.update('report', { file })).rejects.toThrow(
      '파일 업로드를 다시 시도',
    );
    expect(files.uploadFile).not.toHaveBeenCalled();
  });

  it.each(['create', 'update'] as const)(
    'does not let the real worker collect a fresh %s reservation before its lock',
    async (operation) => {
      const insert = repository.manager.insert.getMockImplementation();
      repository.manager.insert.mockImplementation(async (...args) => {
        await insert(...args);
        await cleanup.retry();
      });
      const dto = { activityId: 'activity', file } as CreateActivityReportDto;
      await expect(
        operation === 'create'
          ? service.create(dto)
          : service.update('report', dto),
      ).resolves.toBeDefined();
      expect(files.uploadFile).toHaveBeenCalledTimes(1);
      expect(files.deleteFile).not.toHaveBeenCalledWith(
        files.uploadFile.mock.calls[0][0],
      );
    },
  );

  it('reclaims a reservation after an uploader crashes before acquiring its lock', async () => {
    pending.set('abandoned', {
      fileKey: 'abandoned',
      cleanupAfter: Date.now() + 15 * 60_000,
      lastAttemptAt: 0,
    });
    await cleanup.retry();
    expect(files.deleteFile).not.toHaveBeenCalled();
    await retryExpired();
    expect(files.deleteFile).toHaveBeenCalledWith('abandoned');
    expect(pending.size).toBe(0);
  });

  it.each(['update', 'remove', 'removeForActivity'] as const)(
    '%s completes while the worker is blocked on unrelated storage deletion',
    async (operation) => {
      pending.set('unrelated', {
        fileKey: 'unrelated',
        cleanupAfter: 0,
        lastAttemptAt: 0,
      });
      let release: () => void;
      files.deleteFile.mockImplementationOnce(
        () => new Promise<void>((resolve) => (release = resolve)),
      );
      const worker = cleanup.retry();
      await new Promise(setImmediate);
      expect(files.deleteFile).toHaveBeenCalledWith('unrelated');
      try {
        await (operation === 'update'
          ? service.update('report', { title: 'saved' })
          : service[operation]('report'));
        if (operation === 'update')
          expect(repository.update).toHaveBeenCalledWith(
            { uuid: 'report' },
            { title: 'saved' },
          );
      } finally {
        release();
        await worker;
      }
    },
  );

  it('rejects disguised active content before creating an intent or uploading', async () => {
    const dangerous = Object.assign(new FileSystemStoredFile(), {
      originalName: 'report.pdf',
      path: join(directory, 'dangerous'),
    });
    await expect(service.update('report', { file: dangerous })).rejects.toThrow(
      '문서만 업로드',
    );
    expect(repository.manager.insert).not.toHaveBeenCalled();
    expect(files.uploadFile).not.toHaveBeenCalled();
  });

  it('derives CDN metadata from the verified document instead of the supplied MIME type', async () => {
    await service.update('report', { file });
    expect(files.uploadFile).toHaveBeenCalledWith(expect.any(String), file, {
      contentType: 'application/pdf',
      contentDisposition: "attachment; filename*=UTF-8''report.pdf",
    });
  });

  it('preserves the attachment if the report deletion fails', async () => {
    repository.delete.mockRejectedValue(new Error('database unavailable'));
    await expect(service.remove('report')).rejects.toThrow(
      'database unavailable',
    );
    expect(files.deleteFile).not.toHaveBeenCalled();
  });

  it('does not delete the attachment until the transaction commits', async () => {
    const manager = repository.manager;
    manager.transaction.mockImplementation(async (callback) => {
      await callback(manager);
      expect(files.deleteFile).not.toHaveBeenCalled();
      throw new Error('commit failed');
    });
    await expect(service.remove('report')).rejects.toThrow('commit failed');
    expect(files.deleteFile).not.toHaveBeenCalled();
  });
});
