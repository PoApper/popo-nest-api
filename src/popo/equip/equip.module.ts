import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EquipController } from './equip.controller';
import { EquipService } from './equip.service';
import { Equip } from './equip.entity';
import { FileModule } from '../../file/file.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equip]),
    CacheModule.register(),
    NestjsFormDataModule,
    FileModule,
  ],
  controllers: [EquipController],
  providers: [EquipService],
  exports: [EquipService],
})
export class EquipModule {}
