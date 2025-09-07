import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NoticeLike } from './noticeLike.entity';
import { NoticeLikeDto } from './noticeLike.dto';

@Injectable()
export class NoticeLikeService {
  constructor(
    @InjectRepository(NoticeLike)
    private readonly noticeLikeRepo: Repository<NoticeLike>,
  ) {}

  save(dto: NoticeLikeDto) {
    return this.noticeLikeRepo.save(dto);
  }

  findByUserIdAndNoticeId(userId: string, noticeId: number) {
    return this.noticeLikeRepo.findOne({
      where: { userId: userId, noticeId: noticeId },
    });
  }

  findAllByNoticeId(noticeId: number) {
    return this.noticeLikeRepo.find({
      where: { noticeId: noticeId },
    });
  }

  countLikes(noticeId: number) {
    return this.noticeLikeRepo.count({ where: { noticeId: noticeId } });
  }

  delete(userId: string, noticeId: number) {
    return this.noticeLikeRepo.delete({
      userId: userId,
      noticeId: noticeId,
    });
  }
}
