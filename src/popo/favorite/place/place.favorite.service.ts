import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FavoritePlace } from './place.favorite.entity';
import { FavoritePlaceDto } from './place.favorite.dto';

const Message = {
  NOT_EXISTING_FAVORITE: "There's no such favorite place.",
  MAX_FAVORITES_REACHED: 'A user can only have up to 3 favorite places.',
};

@Injectable()
export class FavoritePlaceService {
  constructor(
    @InjectRepository(FavoritePlace)
    private readonly favoritePlaceRepo: Repository<FavoritePlace>,
  ) {}

  async save(dto: FavoritePlaceDto) {
    const existingFavorites = await this.favoritePlaceRepo.find({
      where: { user_id: dto.user_id },
    });

    if (existingFavorites.length >= 3) {
      throw new BadRequestException(Message.MAX_FAVORITES_REACHED);
    }

    return this.favoritePlaceRepo.save(dto);
  }

  find() {
    return this.favoritePlaceRepo.find();
  }

  findOneByUuid(uuid: string) {
    return this.favoritePlaceRepo.findOneBy({ uuid: uuid });
  }

  async findAllByUserId(user_id: string) {
    const userFavorites = await this.favoritePlaceRepo.find({
      where: { user_id: user_id },
    });

    return userFavorites;
  }

  async getFavoritePlaceCount(place_id: string) {
    const favoritePlaceCount = await this.favoritePlaceRepo.count({
      where: { place_id: place_id },
    });
    return favoritePlaceCount;
  }

  async remove(uuid: string) {
    const existUuid = await this.findOneByUuid(uuid);

    if (!existUuid) {
      throw new BadRequestException(Message.NOT_EXISTING_FAVORITE);
    }

    return this.favoritePlaceRepo.delete({ uuid: uuid });
  }
}
