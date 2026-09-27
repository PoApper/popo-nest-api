import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { randomUUID } from 'crypto';

import { ActivityReport } from './activity-report.entity';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileService } from '../../../file/file.service';
import { Activity } from '../activity/activity.entity';
import { lockActivity } from '../activity/lock-activity';
import { ReportFileDeletion } from './report-file-deletion.entity';
import { ReportFileCleanupService } from './report-file-cleanup.service';
import {
  decodeFileName,
  extensionOf,
  reportContentType,
} from './report-file-format';
import { lockReportFileDeletion } from './lock-report-file-deletion';

@Injectable()
export class ActivityReportService {
  constructor(
    @InjectRepository(ActivityReport)
    private readonly activityReportRepo: Repository<ActivityReport>,
    private readonly fileService: FileService,
    private readonly reportFileCleanupService: ReportFileCleanupService,
  ) {}

  async findAll(query?: {
    activityId?: string;
    period?: string;
    major?: string;
  }): Promise<ActivityReport[]> {
    const where: FindOptionsWhere<ActivityReport> = {};
    if (query?.activityId) where.activityId = query.activityId;
    if (query?.period) where.period = query.period;
    if (query?.major) where.major = query.major;

    return this.activityReportRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(uuid: string): Promise<ActivityReport | null> {
    return this.activityReportRepo.findOne({ where: { uuid } });
  }

  async findOneOrFail(uuid: string): Promise<ActivityReport> {
    const report = await this.findOne(uuid);
    if (!report) {
      throw new NotFoundException('존재하지 않는 활동 수기입니다.');
    }
    return report;
  }

  async create(dto: CreateActivityReportDto): Promise<ActivityReport> {
    const report = this.activityReportRepo.create(this.metadataOf(dto));

    const upload = await this.prepareUpload(dto.activityId, dto.file);

    try {
      return await this.activityReportRepo.manager.transaction(
        async (manager) => {
          await lockActivity(manager, dto.activityId);
          if (upload)
            Object.assign(report, await this.storeFile(manager, upload));
          return manager.getRepository(ActivityReport).save(report);
        },
      );
    } catch (error) {
      // The intent was committed before uploading, and survives this rollback.
      // Only the worker may delete the object after locking that intent.
      await this.reportFileCleanupService.retry();
      throw error;
    }
  }

  async update(
    uuid: string,
    dto: UpdateActivityReportDto,
  ): Promise<ActivityReport | null> {
    const existing = await this.findOneOrFail(uuid);
    const { file } = dto;
    const patch = this.metadataOf(dto);

    const upload = await this.prepareUpload(
      dto.activityId ?? existing.activityId,
      file,
    );

    try {
      await this.activityReportRepo.manager.transaction(async (manager) => {
        for (const activityId of [
          ...new Set([
            existing.activityId,
            dto.activityId ?? existing.activityId,
          ]),
        ].sort()) {
          await lockActivity(manager, activityId);
        }
        const repository = manager.getRepository(ActivityReport);
        const current = await repository.findOneBy({ uuid });
        if (!current)
          throw new NotFoundException('존재하지 않는 활동 수기입니다.');
        if (current.activityId !== existing.activityId) {
          throw new ConflictException(
            '수기가 변경되었습니다. 다시 시도해주세요.',
          );
        }
        if (upload) Object.assign(patch, await this.storeFile(manager, upload));
        if (Object.keys(patch).length) await repository.update({ uuid }, patch);
        if (patch.fileKey && current.fileKey) {
          await manager.insert(ReportFileDeletion, {
            fileKey: current.fileKey,
          });
        }
      });
    } catch (error) {
      await this.reportFileCleanupService.retry();
      throw error;
    }
    await this.reportFileCleanupService.retry();
    return this.findOne(uuid);
  }

  private metadataOf(dto: UpdateActivityReportDto): Partial<ActivityReport> {
    const patch: Partial<ActivityReport> = {};
    const fields = [
      'activityId',
      'title',
      'period',
      'grade',
      'major',
      'author',
      'memo',
    ] as const;
    for (const field of fields) {
      if (dto[field] !== undefined) patch[field] = dto[field];
    }
    return patch;
  }

  async removeForActivity(activityId: string): Promise<void> {
    await this.activityReportRepo.manager.transaction(async (manager) => {
      await lockActivity(manager, activityId);
      const reports = await manager.findBy(ActivityReport, { activityId });
      for (const report of reports) {
        if (report.fileKey)
          await manager.insert(ReportFileDeletion, { fileKey: report.fileKey });
      }
      await manager.delete(Activity, { uuid: activityId });
    });
    await this.reportFileCleanupService.retry();
  }

  async remove(uuid: string): Promise<void> {
    const existing = await this.findOne(uuid);
    if (!existing) return;
    await this.activityReportRepo.manager.transaction(async (manager) => {
      await lockActivity(manager, existing.activityId);
      const report = await manager.findOneBy(ActivityReport, { uuid });
      if (!report) return;
      if (report.activityId !== existing.activityId) {
        throw new ConflictException(
          '수기가 변경되었습니다. 다시 시도해주세요.',
        );
      }
      if (report.fileKey)
        await manager.insert(ReportFileDeletion, { fileKey: report.fileKey });
      await manager.delete(ActivityReport, { uuid });
    });
    await this.reportFileCleanupService.retry();
  }

  private async prepareUpload(activityId: string, file?: MemoryStoredFile) {
    if (!file) return undefined;
    const fileName = decodeFileName(file.originalName);
    const contentType = reportContentType(fileName, file.buffer);
    const key = `activity-report/${activityId}/${randomUUID()}`;
    // Persist before storage I/O: even a DB outage or process crash after PUT
    // cannot lose the compensating deletion. No intent means no upload.
    await this.activityReportRepo.manager.insert(ReportFileDeletion, {
      fileKey: key,
    });
    return { key, file, fileName, contentType };
  }

  /** Lock the committed intent until report persistence and its removal commit. */
  private async storeFile(
    manager: EntityManager,
    upload: Awaited<ReturnType<ActivityReportService['prepareUpload']>>,
  ) {
    const { key, file, fileName, contentType } = upload;
    const intent = await lockReportFileDeletion(manager, key);
    if (!intent) {
      // A worker may have claimed the intent before this transaction began.
      throw new ConflictException('파일 업로드를 다시 시도해주세요.');
    }
    const fileUrl = await this.fileService.uploadFile(key, file, {
      contentType,
      contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
    await manager.delete(ReportFileDeletion, { fileKey: key });

    return {
      fileName,
      fileType: extensionOf(fileName),
      fileKey: key,
      fileUrl,
    };
  }

  /** 뷰어/다운로드용 원본 바이트 */
  async getFileStream(uuid: string) {
    const report = await this.findOneOrFail(uuid);
    if (!report.fileKey) {
      throw new NotFoundException('첨부된 파일이 없습니다.');
    }
    return {
      stream: await this.fileService.getFileStream(report.fileKey),
      fileName: report.fileName,
      fileType: report.fileType,
    };
  }
}
