import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroAssociation, IntroAssociationCategory } from './intro.association.entity';
import { CreateIntroAssociationDto } from './intro.association.dto';

@Injectable()
export class IntroAssociationService {
  constructor(
    @InjectRepository(IntroAssociation)
    private readonly introAssociationRepo: Repository<IntroAssociation>,
    @InjectRepository(IntroAssociationCategory)
    private readonly categoryRepo: Repository<IntroAssociationCategory>,
  ) {}

  async save(dto: CreateIntroAssociationDto) {
    const category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
    if (!category) throw new NotFoundException('Category not found');
    
    return this.introAssociationRepo.save(dto);
  }

  find(findOptions?: any) {
    return this.introAssociationRepo.find({
      ...findOptions,
      relations: ['category'], // 카테고리 정보 포함 조회
    });
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.introAssociationRepo.update(
      { uuid: uuid },
      { imageUrl: imageUrl },
    );
  }

  findOneByUuid(uuid: string) {
    return this.introAssociationRepo.findOne({
      where: { uuid: uuid },
      relations: ['category'],
    });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introAssociationRepo.findOneOrFail({
      where: { uuid: uuid },
      relations: ['category'],
    });
  }

  findOneByName(name: string) {
    return this.introAssociationRepo.findOne({
      where: { name: name },
      relations: ['category'],
    });
  }

  async update(uuid: string, dto: CreateIntroAssociationDto) {
    await this.findOneByUuidOrFail(uuid);
    
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      if (!category) throw new NotFoundException('Category not found');
    }

    return this.introAssociationRepo.update({ uuid: uuid }, dto);
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introAssociationRepo.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introAssociationRepo.update({ uuid: uuid }, { views: views });
  }
}
