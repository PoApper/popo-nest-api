import { CacheModule, Module } from '@nestjs/common';
import { SettingController } from './setting.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [SettingController],
})
export class SettingModule {}
