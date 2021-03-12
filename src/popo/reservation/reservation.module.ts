import { Module } from '@nestjs/common';
import { ReservePlaceModule } from './place/reserve.place.module';
import { ReserveEquipModule } from './equip/reserve.equip.module';

@Module({
  imports: [ReservePlaceModule, ReserveEquipModule]
})
export class ReservationModule {}
