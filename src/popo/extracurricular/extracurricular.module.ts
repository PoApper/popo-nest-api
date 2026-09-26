import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { FileModule } from '../../file/file.module';
import { Activity } from './activity/activity.entity';
import { ActivityReport } from './report/activity-report.entity';
import { ActivityService } from './activity/activity.service';
import { ActivityController } from './activity/activity.controller';
import { ActivityReportService } from './report/activity-report.service';
import { ActivityReportController } from './report/activity-report.controller';
import { ReportFileDeletion } from './report/report-file-deletion.entity';
import { ReportFileCleanupService } from './report/report-file-cleanup.service';
import { ReportDownloadGuard } from './report/report-download.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityReport, ReportFileDeletion]),
    NestjsFormDataModule,
    FileModule,
  ],
  providers: [
    ActivityService,
    ActivityReportService,
    ReportFileCleanupService,
    ReportDownloadGuard,
  ],
  controllers: [ActivityController, ActivityReportController],
  exports: [ActivityService, ActivityReportService],
})
export class ExtracurricularModule {}
