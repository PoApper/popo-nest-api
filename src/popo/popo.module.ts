import { Module } from '@nestjs/common';

import { BenefitModule } from './benefit/benefit.module';
import { CalendarModule } from './academic-calendar/calendar.module';
import { EquipModule } from './equip/equip.module';
import { IntroduceModule } from './introduce/introduce.module';
import { NoticeModule } from './notice/notice.module';
import { PlaceModule } from './place/place.module';
import { ReservationModule } from './reservation/reservation.module';
import { SettingModule } from './setting/setting.module';
import { UserModule } from './user/user.module';
import { WhitebookModule } from './whitebook/whitebook.module';
import { NoticeLikeModule } from './noticeLike/noticeLike.module';
import { FavoritePlaceModule } from './favorite/place/place.favorite.module';

@Module({
  imports: [
    BenefitModule,
    CalendarModule,
    NoticeModule,
    PlaceModule,
    EquipModule,
    IntroduceModule,
    ReservationModule,
    SettingModule,
    UserModule,
    WhitebookModule,
    NoticeLikeModule,
    FavoritePlaceModule,
  ],
  controllers: [],
  providers: [],
})
export class PopoModule {}
