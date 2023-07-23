import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroAssociation } from './intro.association.entity';
import { CreateIntroAssociationDto } from './intro.association.dto';

const Message = {
  NOT_EXISTING_INTRO: "There's no such introduction.",
};

@Injectable()
export class IntroAssociationService {
  constructor(
    @InjectRepository(IntroAssociation)
    private readonly introAssociation_repository: Repository<IntroAssociation>,
  ) {}

  save(dto: CreateIntroAssociationDto) {
    return this.introAssociation_repository.save(dto);
  }

  find(findOptions?: object) {
    return this.introAssociation_repository.find(findOptions);
  }

  updateImageUrl(uuid: string, image_url: string) {
    return this.introAssociation_repository.update(
      { uuid: uuid },
      { image_url: image_url },
    );
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.introAssociation_repository.findOne(findOptions, maybeOptions);
  }

  async update(uuid: string, dto: CreateIntroAssociationDto) {
    const existIntro = await this.findOne({ uuid: uuid });

    if (!existIntro) {
      throw new BadRequestException(Message.NOT_EXISTING_INTRO);
    }

    return this.introAssociation_repository.update({ uuid: uuid }, dto);
  }

  remove(uuid: string) {
    return this.introAssociation_repository.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introAssociation_repository.update(
      { uuid: uuid },
      { views: views },
    );
  }
}
