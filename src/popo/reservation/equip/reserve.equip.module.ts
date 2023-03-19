import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../../../mail/mail.module';
import { UserModule } from '../../user/user.module';
import { ReserveEquip } from './reserve.equip.entity';
import { EquipModule } from '../../equip/equip.module';
import { ReserveEquipController } from './reserve.equip.controller';
import { ReserveEquipService } from './reserve.equip.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReserveEquip]),
    CacheModule.register(),
    MailModule,
    UserModule,
    EquipModule,
  ],
  controllers: [ReserveEquipController],
  providers: [ReserveEquipService],
  exports: [ReserveEquipService],
})
export class ReserveEquipModule {}
