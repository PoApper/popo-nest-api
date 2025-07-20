import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FcmModule } from '../fcm/fcm.module';
import { NotificationService } from './notification.service';
import { ReservePlace } from '../popo/reservation/place/reserve.place.entity';
import { ReserveEquip } from '../popo/reservation/equip/reserve.equip.entity';
import { NotificationRecord } from './entities/notification-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservePlace, ReserveEquip, NotificationRecord]),
    FcmModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
