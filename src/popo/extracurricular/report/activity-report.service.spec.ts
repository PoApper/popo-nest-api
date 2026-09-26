import { Repository } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { ActivityReportService } from './activity-report.service';
import { ActivityReport } from './activity-report.entity';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileService } from '../../../file/file.service';

describe('ActivityReportService storage consistency', () => {
  const existing = {
    uuid: 'report',
    activityId: 'activity',
    fileKey: 'old-key',
  };
  const file = Object.assign(new MemoryStoredFile(), {
    originalName: 'report.pdf',
    buffer: Buffer.from('data'),
  });
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
  };
  let files: { uploadFile: jest.Mock; deleteFile: jest.Mock };
  let service: ActivityReportService;
  beforeEach(() => {
    repository = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn(async (dto) => dto),
      findOne: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn(),
      find: jest.fn(),
    };
    files = {
      uploadFile: jest.fn().mockResolvedValue('https://file'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
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

  it('removes a newly uploaded file and preserves the old one if DB update fails', async () => {
    const error = new Error('database unavailable');
    repository.update.mockRejectedValue(error);
    await expect(service.update('report', { file })).rejects.toBe(error);
    const newKey = files.uploadFile.mock.calls[0][0];
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
    expect(files.deleteFile).toHaveBeenCalledWith(
      files.uploadFile.mock.calls[0][0],
    );
  });

  it('keeps the old object until the database update succeeds', async () => {
    repository.update.mockImplementation(async () => {
      expect(files.deleteFile).not.toHaveBeenCalled();
    });
    await service.update('report', { file });
    expect(files.deleteFile).toHaveBeenCalledWith('old-key');
  });

  it('does not update the database when uploading fails', async () => {
    files.uploadFile.mockRejectedValue(new Error('upload failed'));
    await expect(service.update('report', { file })).rejects.toThrow(
      'upload failed',
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(files.deleteFile).not.toHaveBeenCalled();
  });

  it('does not drop the report row if deleting its object fails', async () => {
    files.deleteFile.mockRejectedValue(new Error('delete failed'));
    await expect(service.remove('report')).rejects.toThrow('delete failed');
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
