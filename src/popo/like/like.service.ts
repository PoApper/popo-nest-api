import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Like } from './like.entity';
import { LikeDto } from './like.dto';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  save(dto: LikeDto) {
    return this.likeRepo.save(dto);
  }

  findByUserIdAndNoticeId(user_id: string, notice_id: string) {
    return this.likeRepo.findOne({
      where: { user_id: user_id, notice_id: notice_id },
    });
  }

  findAllByNoticeId(notice_id: string) {
    return this.likeRepo.find({
      where: { notice_id: notice_id },
    });
  }

  countLikes(notice_id: string) {
    return this.likeRepo.count({ where: { notice_id: notice_id } });
  }

  delete(user_id: string, notice_id: string) {
    return this.likeRepo.delete({ user_id: user_id, notice_id: notice_id });
  }
}
