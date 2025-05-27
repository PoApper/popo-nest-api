import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { SettingModule } from '../setting/setting.module';
import { Nickname } from './nickname.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Nickname]), SettingModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
