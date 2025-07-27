import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';

import { PlaceService } from './place.service';
import { PlaceDto, PlaceImageDto } from './place.dto';
import { PlaceRegion } from './place.meta';
import { UserType } from '../user/user.meta';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';
import { FileBody } from '../../file/file-body.decorator';
import { Public } from '../../common/public-guard.decorator';

@ApiTags('Place')
@Controller('place')
export class PlaceController {
  constructor(
    private readonly placeService: PlaceService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @ApiBody({ type: PlaceDto })
  async create(@Body() dto: PlaceDto) {
    return this.placeService.save(dto);
  }

  @ApiCookieAuth()
  @Post('image/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @FileBody('image')
  async uploadImage(@Param('uuid') uuid: string, @Body() dto: PlaceImageDto) {
    const image_url = await this.fileService.uploadFile(
      `place/${uuid}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.placeService.updateImageUrl(uuid, image_url);
    return image_url;
  }

  @Public()
  @Get()
  getAll() {
    return this.placeService.find();
  }

  @Public()
  @Get(':uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.placeService.findOneByUuid(uuid);
  }

  @Public()
  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.placeService.findOneByName(name);
  }

  @Public()
  @Get('/region/:region')
  async getAllByRegion(@Param('region') region: PlaceRegion) {
    return this.placeService.findAllByRegion(region);
  }

  @ApiCookieAuth()
  @Put(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  async put(@Param('uuid') uuid: string, @Body() updatePlaceDto: PlaceDto) {
    return this.placeService.update(uuid, updatePlaceDto);
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  async delete(@Param('uuid') uuid: string) {
    this.placeService.remove(uuid);
  }
}
