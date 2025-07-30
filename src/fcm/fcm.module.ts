import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FcmService } from './fcm.service';
import { FcmKey } from './entities/fcm-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FcmKey])],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
