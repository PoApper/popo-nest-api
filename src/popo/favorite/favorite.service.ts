import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Favorite } from './favorite.entity';
import { FavoriteDto } from './favorite.dto';

const Message = {
  NOT_EXISTING_FAVORITE: "There's no such favorite.",
  EMPTY_FAVORITE: "There's no favorite selected by the user.",
  MAX_FAVORITES_REACHED: 'A user can only have up to 3 favorite places.',
};

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  async save(dto: FavoriteDto) {
    const existingFavorites = await this.favoriteRepo.find({
      where: { user_id: dto.user_id },
    });

    if (existingFavorites.length >= 3) {
      throw new BadRequestException(Message.MAX_FAVORITES_REACHED);
    }

    return this.favoriteRepo.save(dto);
  }

  find() {
    return this.favoriteRepo.find();
  }

  findOneByUuid(uuid: string) {
    return this.favoriteRepo.findOneBy({ uuid: uuid });
  }

  async findAllByUserId(user_id: string) {
    const userFavorites = await this.favoriteRepo.find({
      where: { user_id: user_id },
    });
    if (!userFavorites || userFavorites.length === 0) {
      throw new BadRequestException(Message.EMPTY_FAVORITE);
    }
    return userFavorites;
  }

  async remove(uuid: string) {
    const existUuid = await this.findOneByUuid(uuid);

    if (!existUuid) {
      throw new BadRequestException(Message.NOT_EXISTING_FAVORITE);
    }

    return this.favoriteRepo.delete({ uuid: uuid });
  }
}
