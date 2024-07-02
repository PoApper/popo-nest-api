import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import * as moment from 'moment-timezone';

import { Notice } from './notice.entity';
import { NoticeDto } from './notice.dto';

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such notice.",
  INVALID_OWNER: 'Only Association can have a notice.',
  INVALID_STAFF: 'Only Staff and ADMIN can be a manager.',
};

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
  ) {}

  save(dto: NoticeDto) {
    return this.noticeRepo.save(dto);
  }

  updateImageUrl(id: number, image_url: string) {
    return this.noticeRepo.update({ id: id }, { image_url: image_url });
  }

  find() {
    return this.noticeRepo.find({ order: { updateAt: 'DESC' } });
  }

  findActive() {
    const now = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    return this.noticeRepo.find({
      where: {
        start_datetime: LessThan(now),
        end_datetime: MoreThanOrEqual(now),
      },
    });
  }

  findOneById(id: number) {
    return this.noticeRepo.findOneBy({ id: id });
  }

  findOneByIdOrFail(id: number) {
    const notice = this.findOneById(id);
    if (!notice) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return notice;
  }

  async update(id: number, dto: NoticeDto) {
    const existNotice = await this.findOneById(id);
    if (!existNotice) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.noticeRepo.update({ id: id }, dto);
  }

  async increaseClickCount(id: number) {
    const notice = await this.noticeRepo.findOneByOrFail({ id: id });
    return this.noticeRepo.update(
      { id: id },
      { click_count: notice.click_count + 1 },
    );
  }

  async increaseLikeCount(id: number) {
    const notice = await this.noticeRepo.findOneByOrFail({ id: id });
    return this.noticeRepo.update(
      { id: id },
      { like_count: notice.like_count + 1 },
    );
  }

  async decreaseLikeCount(id: number) {
    const notice = await this.noticeRepo.findOneByOrFail({ id: id });
    return this.noticeRepo.update(
      { id: id },
      { like_count: notice.like_count - 1 },
    );
  }

  async remove(id: number) {
    const existNotice = await this.findOneById(id);

    if (!existNotice) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.noticeRepo.delete({ id: id });
  }
}
