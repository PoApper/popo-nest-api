import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
  } from '@nestjs/common';
  import { ApiBody, ApiTags } from '@nestjs/swagger';
  
  import { FavoriteService } from './favorite.service';
  import { FavoriteDto } from './favorite.dto';
  
  @ApiTags('Favorite')
  @Controller('favorite')
  export class FavoriteController {
    constructor(
      private readonly favoriteService: FavoriteService,
    ) {}
  
    @Post()
    @ApiBody({ type: FavoriteDto })
    async create(@Body() dto: FavoriteDto) {
      return this.favoriteService.save(dto);
    }
  
    @Get()
    getAll() {
      return this.favoriteService.find();
    }
  
    @Get(':uuid')
    async getOne(@Param('uuid') uuid: string) {
      return this.favoriteService.findOneByUuid(uuid);
    }
  
    @Get('/user_id/:user_id')
    async getOneByName(@Param('user_id') user_id: string) {
      return this.favoriteService.findOnebyUserId(user_id);
    }

    @Delete(':uuid')
    async delete(@Param('uuid') uuid: string) {
      this.favoriteService.remove(uuid);
    }
  }
  