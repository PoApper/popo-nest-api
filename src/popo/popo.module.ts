import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PlaceModule } from './place/place.module';
import { EquipModule } from './equip/equip.module';
import { ReservationModule } from './reservation/reservation.module';
import { IntroduceModule } from './introduce/introduce.module';
import { WhitebookModule } from './whitebook/whitebook.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [
    UserModule,
    PlaceModule,
    EquipModule,
    ReservationModule,
    IntroduceModule,
    WhitebookModule,
    SettingModule,
  ],
  controllers: [],
  providers: [],
})
export class PopoModule {}
