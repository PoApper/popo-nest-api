import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroClub } from './intro.club.entity';
import { CreateIntroClubDto } from './intro.club.dto';

@Injectable()
export class IntroClubService {
  constructor(
    @InjectRepository(IntroClub)
    private readonly introClub_repository: Repository<IntroClub>,
  ) {}

  save(dto: CreateIntroClubDto) {
    return this.introClub_repository.save(dto);
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.introClub_repository.update(
      { uuid: uuid },
      { image_url: imageUrl },
    );
  }

  find(findOptions?: object) {
    return this.introClub_repository.find(findOptions);
  }

  findOneByUuid(uuid: string) {
    return this.introClub_repository.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introClub_repository.findOneByOrFail({ uuid: uuid });
  }

  findOneByName(name: string) {
    return this.introClub_repository.findOneBy({ name: name });
  }

  async update(uuid: string, dto: CreateIntroClubDto) {
    await this.findOneByUuidOrFail(uuid);

    return this.introClub_repository.update({ uuid: uuid }, dto);
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introClub_repository.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introClub_repository.update({ uuid: uuid }, { views: views });
  }
}
