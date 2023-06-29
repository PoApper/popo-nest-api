import {
  Body,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
  UseInterceptors,
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
@UseInterceptors(CacheInterceptor)
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

  @Post('image/:place_uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FileBody('image')
  async uploadImage(
    @Param('place_uuid') place_uuid: string,
    @Body() dto: PlaceImageDto,
  ) {
    const place_image_url = await this.fileService.uploadFile(
      `place/${place_uuid}`,
      dto.image,
    );
    return this.placeService.updateImageUrl(place_uuid, place_image_url);
  }

  @Get()
  getAll() {
    return this.placeService.find();
  }

  @Get(':uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.placeService.findOne(uuid);
  }

  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.placeService.findOneByName(name);
  }

  @Get('/image/:imageName')
  getPlaceImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, { root: './uploads/place' });
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
