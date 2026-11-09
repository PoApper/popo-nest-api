import { normalizeTranslations } from '../../../utils/translated-fields';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntroClub } from './intro.club.entity';
import { CreateIntroClubDto } from './intro.club.dto';

@Injectable()
export class IntroClubService {
  constructor(
    @InjectRepository(IntroClub)
    private readonly introClubRepo: Repository<IntroClub>,
  ) {}

  save(dto: CreateIntroClubDto) {
    return this.introClubRepo.save({
      ...dto,
      ...normalizeTranslations(
        dto,
        [
          'nameEn',
          'shortDescEn',
          'contentEn',
          'locationEn',
          'representativeEn',
          'contactEn',
        ],
        ['contentEn'],
      ),
    });
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.introClubRepo.update({ uuid: uuid }, { imageUrl: imageUrl });
  }

  find(findOptions?: object) {
    return this.introClubRepo.find(findOptions);
  }

  findOneByUuid(uuid: string) {
    return this.introClubRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.introClubRepo.findOneByOrFail({ uuid: uuid });
  }

  findOneByName(name: string) {
    return this.introClubRepo.findOneBy({ name: name });
  }

  async update(uuid: string, dto: CreateIntroClubDto) {
    await this.findOneByUuidOrFail(uuid);

    return this.introClubRepo.update(
      { uuid: uuid },
      {
        ...dto,
        ...normalizeTranslations(
          dto,
          [
            'nameEn',
            'shortDescEn',
            'contentEn',
            'locationEn',
            'representativeEn',
            'contactEn',
          ],
          ['contentEn'],
        ),
      },
    );
  }

  async remove(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.introClubRepo.delete({ uuid: uuid });
  }

  updateViewCount(uuid: string, views: number) {
    return this.introClubRepo.update({ uuid: uuid }, { views: views });
  }
}
