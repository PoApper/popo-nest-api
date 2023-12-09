import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { AnnouncementDto } from './announcement.dto';

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such announcement.",
  INVALID_OWNER: 'Only Association can have a announcement.',
  INVALID_STAFF: 'Only Staff and ADMIN can be a manager.',
};

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  save(dto: AnnouncementDto) {
    return this.announcementRepo.save(dto);
  }

  updateImageUrl(id: number, image_url: string) {
    return this.announcementRepo.update({ id: id }, { image_url: image_url });
  }

  find() {
    return this.announcementRepo.find({ order: { updateAt: 'DESC' } });
  }

  findOneById(id: number) {
    return this.announcementRepo.findOneBy({ id: id });
  }

  findOneByIdOrFail(id: number) {
    const announcement = this.findOneById(id);
    if (!announcement) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return announcement;
  }

  async update(id: number, dto: AnnouncementDto) {
    const existAnnouncement = await this.findOneById(id);
    if (!existAnnouncement) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.announcementRepo.update({ id: id }, dto);
  }
  
  async increaseClickCount(id: number) {
    const announcement = await this.announcementRepo.findOneByOrFail({ id: id });
    return this.announcementRepo.update(
      { id: id },
      { click_count: announcement.click_count + 1 },
    );
  }

  async remove(id: number) {
    const existAnnouncement = await this.findOneById(id);

    if (!existAnnouncement) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.announcementRepo.delete({ id: id });
  }
}
