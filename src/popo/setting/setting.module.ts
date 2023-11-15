import { Module } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { SettingController } from './setting.controller';
import { FileModule } from '../../file/file.module';

@Module({
  imports: [FileModule, NestjsFormDataModule],
  controllers: [SettingController],
})
export class SettingModule {}
