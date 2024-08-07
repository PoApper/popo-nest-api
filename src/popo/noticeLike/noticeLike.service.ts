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

  findByUserIdAndNoticeId(user_id: string, notice_id: string) {
    return this.noticeLikeRepo.findOne({
      where: { user_id: user_id, notice_id: notice_id },
    });
  }

  findAllByNoticeId(notice_id: string) {
    return this.noticeLikeRepo.find({
      where: { notice_id: notice_id },
    });
  }

  countLikes(notice_id: string) {
    return this.noticeLikeRepo.count({ where: { notice_id: notice_id } });
  }

  delete(user_id: string, notice_id: string) {
    return this.noticeLikeRepo.delete({
      user_id: user_id,
      notice_id: notice_id,
    });
  }
}
