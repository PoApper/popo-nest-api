import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoticeLike } from './noticeLike.entity';
import { NoticeLikeController } from './noticeLike.controller';
import { NoticeLikeService } from './noticeLike.service';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeLike])],
  controllers: [NoticeLikeController],
  providers: [NoticeLikeService],
  exports: [NoticeLikeService],
})
export class NoticeLikeModule {}
