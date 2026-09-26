import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoryStoredFile } from 'nestjs-form-data';
import { randomUUID } from 'crypto';

import { ActivityReport } from './activity-report.entity';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileService } from '../../../file/file.service';

/**
 * multipart 파일명 인코딩 보정.
 *
 * RFC 7578 은 파일명 인코딩을 정하지 않아서, 브라우저가 보낸 UTF-8 바이트를
 * 파서가 latin1 문자열로 해석해 넘겨준다. 그대로 두면 "통합 문서 1.pdf" 가
 * "íµí© ë¬¸ì 1.pdf" 로 저장된다.
 * latin1 로 되돌린 바이트가 올바른 UTF-8 이면 그걸 쓰고, 아니면 원본을 유지한다.
 */
export const decodeFileName = (rawName: string) => {
  if (!rawName) return rawName;

  const bytes = Buffer.from(rawName, 'latin1');
  const decoded = bytes.toString('utf8');

  // 되돌린 값이 깨졌거나(U+FFFD) 왕복이 맞지 않으면 원본이 이미 정상이다.
  if (decoded.includes('�')) return rawName;
  return Buffer.from(decoded, 'utf8').equals(bytes) ? decoded : rawName;
};

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
  private readonly logger = new Logger(ActivityReportService.name);

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
    const report = this.reportRepository.create(this.metadataOf(dto));

    if (dto.file) {
      Object.assign(report, await this.storeFile(dto.activityId, dto.file));
    }

    try {
      return await this.reportRepository.save(report);
    } catch (error) {
      if (report.fileKey) await this.cleanupFile(report.fileKey);
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

    if (file) {
      Object.assign(
        patch,
        await this.storeFile(dto.activityId ?? existing.activityId, file),
      );
    }

    try {
      if (Object.keys(patch).length) {
        await this.reportRepository.update({ uuid }, patch);
      }
    } catch (error) {
      // DB가 새 파일을 참조하기 전에는 기존 파일을 삭제하지 않는다.
      if (patch.fileKey) await this.cleanupFile(patch.fileKey);
      throw error;
    }
    if (patch.fileKey && existing.fileKey) {
      await this.cleanupFile(existing.fileKey);
    }
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

  private async cleanupFile(key: string): Promise<void> {
    try {
      await this.fileService.deleteFile(key);
    } catch (error) {
      // 저장소와 DB는 단일 트랜잭션에 참여하지 않으므로 정리 실패를 기록한다.
      this.logger.error(
        `Failed to clean up activity report file: ${key}`,
        error,
      );
    }
  }

  async removeForActivity(activityId: string): Promise<void> {
    const reports = await this.findAll({ activityId });
    for (const report of reports) await this.remove(report.uuid);
  }

  async remove(uuid: string): Promise<void> {
    const existing = await this.findOne(uuid);
    if (existing?.fileKey) {
      await this.fileService.deleteFile(existing.fileKey);
    }
    await this.reportRepository.delete({ uuid });
  }

  /** 원본 문서를 저장하고 엔티티에 채울 파일 관련 필드를 돌려준다. */
  private async storeFile(activityId: string, file: MemoryStoredFile) {
    const fileName = decodeFileName(file.originalName);
    const key = `activity-report/${activityId}/${randomUUID()}`;
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
