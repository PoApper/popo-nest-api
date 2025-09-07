import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { SettingController } from './setting.controller';
import { FileModule } from '../../file/file.module';
import { SettingService } from './setting.service';
import { User } from '../user/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NestjsFormDataModule,
    FileModule,
    ConfigModule,
  ],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
