import { Module } from '@nestjs/common';
import { BenefitModule } from './benefit/benefit.module';
import { EquipModule } from './equip/equip.module';
import { IntroduceModule } from './introduce/introduce.module';
import { PlaceModule } from './place/place.module';
import { ReservationModule } from './reservation/reservation.module';
import { SettingModule } from './setting/setting.module';
import { UserModule } from './user/user.module';
import { WhitebookModule } from './whitebook/whitebook.module';

@Module({
  imports: [
    BenefitModule,
    PlaceModule,
    EquipModule,
    IntroduceModule,
    ReservationModule,
    SettingModule,
    UserModule,
    WhitebookModule,
  ],
  controllers: [],
  providers: [],
})
export class PopoModule {}
