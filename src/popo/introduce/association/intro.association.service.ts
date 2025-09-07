import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroAssociation } from './intro.association.entity';
import { CreateIntroAssociationDto } from './intro.association.dto';

@Injectable()
export class IntroAssociationService {
  constructor(
    @InjectRepository(IntroAssociation)
    private readonly introAssociationRepo: Repository<IntroAssociation>,
  ) {}

  save(dto: CreateIntroAssociationDto) {
    return this.introAssociationRepo.save(dto);
  }

  find(findOptions?: object) {
    return this.introAssociationRepo.find(findOptions);
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.introAssociationRepo.update(
      { uuid: uuid },
      { imageUrl: imageUrl },
    );
  }

  findOneByUuid(uuid: string) {
    return this.introAssociationRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introAssociationRepo.findOneByOrFail({ uuid: uuid });
  }

  findOneByName(name: string) {
    return this.introAssociationRepo.findOneBy({ name: name });
  }

  async update(uuid: string, dto: CreateIntroAssociationDto) {
    await this.findOneByUuidOrFail(uuid);
    return this.introAssociationRepo.update({ uuid: uuid }, dto);
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introAssociationRepo.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introAssociationRepo.update(
      { uuid: uuid },
      { views: views },
    );
  }
}
