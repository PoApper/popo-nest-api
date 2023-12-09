import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { Announcement } from './announcement.entity';
import { FileModule } from '../../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    NestjsFormDataModule,
    FileModule,
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
