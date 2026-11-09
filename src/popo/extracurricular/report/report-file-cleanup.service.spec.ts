import { LessThanOrEqual, Repository } from 'typeorm';
import { FileService } from '../../../file/file.service';
import { ReportFileCleanupService } from './report-file-cleanup.service';
import { ReportFileDeletion } from './report-file-deletion.entity';

describe('ReportFileCleanupService reservations', () => {
  const setup = (locked: ReportFileDeletion | null) => {
    const files = { deleteFile: jest.fn().mockResolvedValue(undefined) };
    const manager = {
      connection: { options: { type: 'mariadb' } },
      findOne: jest.fn().mockResolvedValue(locked),
      delete: jest.fn(),
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const repository = {
      find: jest
        .fn()
        .mockResolvedValue([
          { fileKey: 'upload', cleanupAfter: 0, lastAttemptAt: 0 },
        ]),
      update: jest.fn(),
      manager,
    };
    return {
      files,
      repository,
      manager,
      service: new ReportFileCleanupService(
        repository as unknown as Repository<ReportFileDeletion>,
        files as unknown as FileService,
      ),
    };
  };

  it('filters eligible reservations before limiting the batch', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    try {
      const { service, repository, files } = setup({
        fileKey: 'upload',
        cleanupAfter: 1_000,
        lastAttemptAt: 0,
      });
      await service.retry();
      expect(repository.find).toHaveBeenCalledWith({
        where: { cleanupAfter: LessThanOrEqual(1_000) },
        take: 100,
        order: { lastAttemptAt: 'ASC', fileKey: 'ASC' },
      });
      expect(files.deleteFile).toHaveBeenCalledWith('upload');
    } finally {
      now.mockRestore();
    }
  });

  it('rechecks eligibility after taking the row lock', async () => {
    const { service, manager, files } = setup({
      fileKey: 'upload',
      cleanupAfter: Date.now() + 60_000,
      lastAttemptAt: 0,
    });
    await service.retry();
    expect(manager.findOne).toHaveBeenCalledWith(ReportFileDeletion, {
      where: { fileKey: 'upload' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(files.deleteFile).not.toHaveBeenCalled();
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('does not delete a live object when the uploader committed while the worker waited for its lock', async () => {
    const { service, manager, files } = setup(null);
    await service.retry();
    expect(manager.findOne).toHaveBeenCalled();
    expect(files.deleteFile).not.toHaveBeenCalled();
    expect(manager.delete).not.toHaveBeenCalled();
  });
});
