import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { FavoritePlaceService } from './place.favorite.service';
import { FavoritePlaceDto } from './place.favorite.dto';

@ApiTags('Favorite Place')
@Controller('favorite-place')
export class FavoritePlaceController {
  constructor(private readonly favoritePlaceService: FavoritePlaceService) {}

  @Post()
  @ApiBody({ type: FavoritePlaceDto })
  async create(@Body() dto: FavoritePlaceDto) {
    return this.favoritePlaceService.save(dto);
  }

  @Get()
  getAll() {
    return this.favoritePlaceService.find();
  }

  @Get(':uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.favoritePlaceService.findOneByUuid(uuid);
  }

  @Get('/user_id/:user_id')
  async getAllByUserID(@Param('user_id') user_id: string) {
    return this.favoritePlaceService.findAllByUserId(user_id);
  }

  @Get('/count/:place_id')
  async getFavoritePlaceCount(@Param('place_id') place_id: string) {
    return this.favoritePlaceService.getFavoritePlaceCount(place_id);
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string) {
    this.favoritePlaceService.remove(uuid);
  }
}
