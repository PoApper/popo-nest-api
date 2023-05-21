import { CacheModule, Module } from '@nestjs/common';
import { UserModule } from '../popo/user/user.module';
import { UserStatisticsController } from './user.statistics.controller';
import { ReservePlaceModule } from '../popo/reservation/place/reserve.place.module';
import { ReservationStatisticsController } from './reservation.statistics.controller';

@Module({
  imports: [CacheModule.register(), UserModule, ReservePlaceModule],
  controllers: [UserStatisticsController, ReservationStatisticsController],
  providers: [],
})
export class StatisticsModule {}
