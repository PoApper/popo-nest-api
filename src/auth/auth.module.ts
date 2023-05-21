import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../popo/user/user.module';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { ReservePlaceModule } from '../popo/reservation/place/reserve.place.module';
import { ReserveEquipModule } from '../popo/reservation/equip/reserve.equip.module';
import { PasswordChangeModule } from './password-change/password-change.module';

@Module({
  imports: [
    UserModule,
    MailModule,
    ReservePlaceModule,
    ReserveEquipModule,
    PassportModule,
    PasswordChangeModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '360000s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
