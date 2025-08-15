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

  findByUserIdAndNoticeId(user_id: string, notice_id: number) {
    return this.noticeLikeRepo.findOne({
      where: { userId: user_id, noticeId: notice_id },
    });
  }

  findAllByNoticeId(notice_id: number) {
    return this.noticeLikeRepo.find({
      where: { noticeId: notice_id },
    });
  }

  countLikes(notice_id: number) {
    return this.noticeLikeRepo.count({ where: { noticeId: notice_id } });
  }

  delete(user_id: string, notice_id: number) {
    return this.noticeLikeRepo.delete({
      userId: user_id,
      noticeId: notice_id,
    });
  }
}
