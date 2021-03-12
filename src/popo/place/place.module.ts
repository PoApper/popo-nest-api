import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {PlaceController} from './place.controller';
import {PlaceService} from './place.service';
import {Place} from "./place.entity";
import {UserModule} from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Place]),
    UserModule
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService]
})
export class PlaceModule {
}
