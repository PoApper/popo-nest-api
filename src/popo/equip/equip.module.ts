import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {EquipController} from './equip.controller';
import {EquipService} from './equip.service';
import {Equip} from "./equip.entity";
import {UserModule} from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Equip]), UserModule],
  controllers: [EquipController],
  providers: [EquipService],
  exports: [EquipService]
})
export class EquipModule {
}
