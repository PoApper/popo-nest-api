import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroAssociation } from './intro.association.entity';
import { CreateIntroAssociationDto } from './intro.association.dto';

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

  findOneByUuid(uuid: string) {
    return this.introAssociation_repository.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introAssociation_repository.findOneByOrFail({ uuid: uuid });
  }

  findOneByName(name: string) {
    return this.introAssociation_repository.findOneBy({ name: name });
  }

  async update(uuid: string, dto: CreateIntroAssociationDto) {
    await this.findOneByUuidOrFail(uuid);
    return this.introAssociation_repository.update({ uuid: uuid }, dto);
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introAssociation_repository.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introAssociation_repository.update(
      { uuid: uuid },
      { views: views },
    );
  }
}
