import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipController } from './equip.controller';
import { EquipService } from './equip.service';
import { Equip } from './equip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equip]), CacheModule.register()],
  controllers: [EquipController],
  providers: [EquipService],
  exports: [EquipService],
})
export class EquipModule {}
