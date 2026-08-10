import { Module } from '@nestjs/common';
import { ReservePlaceModule } from './place/reserve.place.module';
import { ReserveEquipModule } from './equip/reserve.equip.module';
import { OutdatedReservationService } from './outdated-reservation.service';
import { OutdatedReservationController } from './outdated-reservation.controller';

@Module({
  imports: [ReservePlaceModule, ReserveEquipModule],
  controllers: [OutdatedReservationController],
  providers: [OutdatedReservationService],
})
export class ReservationModule {}
