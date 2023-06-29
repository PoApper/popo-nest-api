import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller';
import { FileModule } from '../../file/file.module';

@Module({
  imports: [FileModule],
  controllers: [SettingController],
})
export class SettingModule {}
