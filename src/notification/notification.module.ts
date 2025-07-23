import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FcmModule } from '../fcm/fcm.module';
import { NotificationService } from './notification.service';
import { ReservePlace } from '../popo/reservation/place/reserve.place.entity';
import { ReserveEquip } from '../popo/reservation/equip/reserve.equip.entity';
import { EquipModule } from '../popo/equip/equip.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservePlace, ReserveEquip]),
    FcmModule,
    EquipModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
