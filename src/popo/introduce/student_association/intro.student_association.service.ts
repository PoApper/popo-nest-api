import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroStudentAssociation } from './intro.student_association.entity';
import { CreateIntroStudentAssociationDto } from './intro.student_association.dto';

@Injectable()
export class IntroStudentAssociationService {
  constructor(
    @InjectRepository(IntroStudentAssociation)
    private readonly introStudentAssociationRepo: Repository<IntroStudentAssociation>,
  ) {}

  save(dto: CreateIntroStudentAssociationDto) {
    return this.introStudentAssociationRepo.save(dto);
  }

  find(findOptions?: object) {
    return this.introStudentAssociationRepo.find(findOptions);
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.introStudentAssociationRepo.update(
      { uuid: uuid },
      { imageUrl: imageUrl },
    );
  }

  findOneByUuid(uuid: string) {
    return this.introStudentAssociationRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introStudentAssociationRepo.findOneByOrFail({ uuid: uuid });
  }

  findOneByName(name: string) {
    return this.introStudentAssociationRepo.findOneBy({ name: name });
  }

  async update(uuid: string, dto: CreateIntroStudentAssociationDto) {
    await this.findOneByUuidOrFail(uuid);
    return this.introStudentAssociationRepo.update({ uuid: uuid }, dto);
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introStudentAssociationRepo.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introStudentAssociationRepo.update({ uuid: uuid }, { views: views });
  }
}
