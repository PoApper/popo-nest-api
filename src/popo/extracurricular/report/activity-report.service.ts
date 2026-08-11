import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import * as moment from 'moment';

import { ActivityReport } from './activity-report.entity';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileService } from '../../../file/file.service';

/** "2025_보고서.docx" -> "docx" */
export const extensionOf = (fileName: string) => {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx + 1).toLowerCase();
};

/** "2025_보고서.docx" -> "2025_보고서" */
export const baseNameOf = (fileName: string) => {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? fileName : fileName.slice(0, idx);
};

@Injectable()
export class ActivityReportService {
  constructor(
    @InjectRepository(ActivityReport)
    private readonly reportRepository: Repository<ActivityReport>,
    private readonly fileService: FileService,
  ) {}

  async findAll(query?: {
    activityId?: string;
    period?: string;
    major?: string;
  }): Promise<ActivityReport[]> {
    const where: Record<string, string> = {};
    if (query?.activityId) where.activityId = query.activityId;
    if (query?.period) where.period = query.period;
    if (query?.major) where.major = query.major;

    return this.reportRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(uuid: string): Promise<ActivityReport | null> {
    return this.reportRepository.findOne({ where: { uuid } });
  }

  async findOneOrFail(uuid: string): Promise<ActivityReport> {
    const report = await this.findOne(uuid);
    if (!report) {
      throw new NotFoundException('존재하지 않는 활동 수기입니다.');
    }
    return report;
  }

  async create(dto: CreateActivityReportDto): Promise<ActivityReport> {
    const { file, ...rest } = dto;
    const report = this.reportRepository.create(rest);

    if (file) {
      Object.assign(report, await this.storeFile(dto.activityId, file));
    }

    return this.reportRepository.save(report);
  }

  async update(
    uuid: string,
    dto: UpdateActivityReportDto,
  ): Promise<ActivityReport | null> {
    const existing = await this.findOneOrFail(uuid);
    const { file, ...rest } = dto;

    // undefined 인 필드는 건드리지 않는다. multipart 는 보낸 필드만 채워온다.
    const patch: Partial<ActivityReport> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }

    if (file) {
      Object.assign(
        patch,
        await this.storeFile(dto.activityId ?? existing.activityId, file),
      );
      if (existing.fileKey) {
        await this.fileService.deleteFile(existing.fileKey).catch(() => null);
      }
    }

    await this.reportRepository.update({ uuid }, patch);
    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<void> {
    const existing = await this.findOne(uuid);
    if (existing?.fileKey) {
      await this.fileService.deleteFile(existing.fileKey).catch(() => null);
    }
    await this.reportRepository.delete({ uuid });
  }

  /** 원본 문서를 저장하고 엔티티에 채울 파일 관련 필드를 돌려준다. */
  private async storeFile(activityId: string, file: MemoryStoredFile) {
    const fileName = file.originalName;
    const key = `activity-report/${activityId}/${moment().format(
      'YYYY-MM-DD/HHmmss',
    )}/${fileName}`;
    const fileUrl = await this.fileService.uploadFile(key, file);

    return {
      fileName,
      fileType: extensionOf(fileName),
      fileKey: key,
      fileUrl,
    };
  }

  /** 뷰어/다운로드용 원본 바이트 */
  async getFileBuffer(uuid: string) {
    const report = await this.findOneOrFail(uuid);
    if (!report.fileKey) {
      throw new NotFoundException('첨부된 파일이 없습니다.');
    }
    return {
      buffer: await this.fileService.getFile(report.fileKey),
      fileName: report.fileName,
      fileType: report.fileType,
    };
  }
}
