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
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { PlaceService } from './place.service';
import { PlaceDto, PlaceImageDto } from './place.dto';
import { PlaceRegion } from './place.meta';
import { UserType } from '../user/user.meta';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';
import { FileBody } from '../../file/file-body.decorator';

@ApiTags('Place')
@Controller('place')
export class PlaceController {
  constructor(
    private readonly placeService: PlaceService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: PlaceDto })
  async create(@Body() dto: PlaceDto) {
    return this.placeService.save(dto);
  }

  @Post('image/:uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FileBody('image')
  async uploadImage(@Param('uuid') uuid: string, @Body() dto: PlaceImageDto) {
    const image_url = await this.fileService.uploadFile(
      `place/${uuid}`,
      dto.image,
    );
    await this.placeService.updateImageUrl(uuid, image_url);
    return image_url;
  }

  @Get()
  getAll() {
    return this.placeService.find();
  }

  @Get(':uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.placeService.findOneByUuid(uuid);
  }

  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.placeService.findOneByName(name);
  }

  @Get('/region/:region')
  async getAllByRegion(@Param('region') region: PlaceRegion) {
    return this.placeService.findAllByRegion(region);
  }

  @Put(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async put(@Param('uuid') uuid: string, @Body() updatePlaceDto: PlaceDto) {
    return this.placeService.update(uuid, updatePlaceDto);
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('uuid') uuid: string) {
    this.placeService.remove(uuid);
  }
}
