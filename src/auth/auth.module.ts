import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../popo/user/user.module';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { ReservePlaceModule } from '../popo/reservation/place/reserve.place.module';
import { ReserveEquipModule } from '../popo/reservation/equip/reserve.equip.module';
@Module({
  imports: [
    UserModule,
    MailModule,
    ReservePlaceModule,
    ReserveEquipModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
