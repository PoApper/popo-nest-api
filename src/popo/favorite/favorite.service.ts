import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Favorite } from './favorite.entity';
import { FavoriteDto } from './favorite.dto';

const Message = {
  NOT_EXISTING_FAVORITE: "There's no such favorite.",
  NOT_EXISTING_USER: "There's no such user.",
};

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  save(dto: FavoriteDto) {
    return this.favoriteRepo.save(dto);
  }

  find() {
    return this.favoriteRepo.find();
  }

  findOneByUuid(uuid: string) {
    return this.favoriteRepo.findOneBy({ uuid: uuid });
  }

  findOnebyUserId(user_id: string) {
    const existUserFavorite = this.favoriteRepo.findOneBy({ user_id: user_id });
    if (!existUserFavorite) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }
    return existUserFavorite;
  }

  async remove(uuid: string) {
    const existUuid = await this.findOneByUuid(uuid);

    if (!existUuid) {
      throw new BadRequestException(Message.NOT_EXISTING_FAVORITE);
    }

    return this.favoriteRepo.delete({ uuid: uuid });
  }
}
