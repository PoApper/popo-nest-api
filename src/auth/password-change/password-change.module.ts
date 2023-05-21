import { Module } from '@nestjs/common';
import { UserModule } from '../../popo/user/user.module';
import { MailModule } from '../../mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordChangeRequestEntity } from './password-change-request.entity';
import { PasswordChangeService } from './password-change.service';
import { PasswordChangeController } from './password-change.controller';

@Module({
  imports: [
    UserModule,
    MailModule,
    TypeOrmModule.forFeature([PasswordChangeRequestEntity]),
  ],
  providers: [PasswordChangeService],
  controllers: [PasswordChangeController],
})
export class PasswordChangeModule {}
