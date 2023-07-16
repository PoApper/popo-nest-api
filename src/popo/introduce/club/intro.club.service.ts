import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroClub } from './intro.club.entity';
import { CreateIntroClubDto } from './intro.club.dto';

const Message = {
  NOT_EXISTING_INTRO: "There's no such introduction.",
};

@Injectable()
export class IntroClubService {
  constructor(
    @InjectRepository(IntroClub)
    private readonly introClub_repository: Repository<IntroClub>,
  ) {}

  save(dto: CreateIntroClubDto) {
    return this.introClub_repository.save(dto);
  }

  updateImageUrl(uuid: string, image_url: string) {
    return this.introClub_repository.update(
      { uuid: uuid },
      { image_url: image_url },
    );
  }

  find(findOptions?: object) {
    return this.introClub_repository.find(findOptions);
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.introClub_repository.findOne(findOptions, maybeOptions);
  }

  async update(uuid: string, dto: CreateIntroClubDto) {
    const existIntro = await this.findOne({ uuid: uuid });

    if (!existIntro) {
      throw new BadRequestException(Message.NOT_EXISTING_INTRO);
    }

    return this.introClub_repository.update(
      { uuid: uuid, name: existIntro.name },
      dto,
    );
  }

  remove(uuid: string) {
    return this.introClub_repository.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introClub_repository.update({ uuid: uuid }, { views: views });
  }
}
