import { Module } from '@nestjs/common';
import { UserModule } from '../popo/user/user.module';
import { UserStatisticsController } from './user.statistics.controller';
import { ReservePlaceModule } from '../popo/reservation/place/reserve.place.module';
import { ReservationPlaceStatisticsController } from './reservation.place.statistics.controller';
import { ReserveEquipModule } from 'src/popo/reservation/equip/reserve.equip.module';
import { ReservationEquipmentStatisticsController } from './reservation.equip.statistics.controller';

@Module({
  imports: [UserModule, ReservePlaceModule, ReserveEquipModule],
  controllers: [
    UserStatisticsController,
    ReservationPlaceStatisticsController,
    ReservationEquipmentStatisticsController,
  ],
  providers: [],
})
export class StatisticsModule {}
