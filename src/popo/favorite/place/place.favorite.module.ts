import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FavoritePlace } from './place.favorite.entity';
import { FavoritePlaceController } from './place.favorite.controller';
import { FavoritePlaceService } from './place.favorite.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePlace])],
  providers: [FavoritePlaceService],
  controllers: [FavoritePlaceController],
})
export class FavoritePlaceModule {}
