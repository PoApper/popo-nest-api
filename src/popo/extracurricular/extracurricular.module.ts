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

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityReport]),
    NestjsFormDataModule,
    FileModule,
  ],
  providers: [ActivityService, ActivityReportService],
  controllers: [ActivityController, ActivityReportController],
  exports: [ActivityService, ActivityReportService],
})
export class ExtracurricularModule {}
