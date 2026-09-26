import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileService } from '../../../file/file.service';
import { ReportFileDeletion } from './report-file-deletion.entity';

@Injectable()
export class ReportFileCleanupService {
  private readonly logger = new Logger(ReportFileCleanupService.name);
  private running = false;

  constructor(
    @InjectRepository(ReportFileDeletion)
    private readonly deletions: Repository<ReportFileDeletion>,
    private readonly files: FileService,
  ) {}

  @Interval(60_000)
  async retry(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (const deletion of await this.deletions.find({
        take: 100,
        order: { lastAttemptAt: 'ASC', fileKey: 'ASC' },
      })) {
        try {
          // Move failed keys behind other pending work, avoiding starvation.
          await this.deletions.update(
            { fileKey: deletion.fileKey },
            { lastAttemptAt: Date.now() },
          );
          await this.files.deleteFile(deletion.fileKey);
          await this.deletions.delete({ fileKey: deletion.fileKey });
        } catch (error) {
          this.logger.error(
            `File cleanup will retry: ${deletion.fileKey}`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Could not read pending report file deletions', error);
    } finally {
      this.running = false;
    }
  }
}
