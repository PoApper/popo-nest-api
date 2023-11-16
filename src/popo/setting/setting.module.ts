import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { NestjsFormDataModule } from 'nestjs-form-data';

import { SettingController } from './setting.controller';
import { FileModule } from '../../file/file.module';
import { SettingService } from './setting.service';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NestjsFormDataModule,
    FileModule,
  ],
  controllers: [SettingController],
  providers: [SettingService],
})
export class SettingModule {}
