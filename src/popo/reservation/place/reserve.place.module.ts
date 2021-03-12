import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {MailModule} from "../../../mail/mail.module";
import {ReservePlaceController} from "./reserve.place.controller";
import {ReservePlaceService} from "./reserve.place.service";
import {ReservePlace} from "./reserve.place.entity";
import {UserModule} from "../../user/user.module";
import {PlaceModule} from "../../place/place.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservePlace]),
    MailModule,
    UserModule,
    PlaceModule,
  ],
  controllers: [ReservePlaceController],
  providers: [ReservePlaceService],
  exports: [ReservePlaceService]
})
export class ReservePlaceModule {
}
