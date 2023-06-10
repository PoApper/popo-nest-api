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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { PlaceService } from './place.service';
import { PlaceDto, PlaceImageDto } from './place.dto';
import { PlaceRegion } from './place.meta';
import { UserType } from '../user/user.meta';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { imageFileFilter, editFileName } from '../../utils/fileUpload';
import { FileService } from '../../file/file.service';

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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/place',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async create(@Body() createPlaceDto: PlaceDto, @UploadedFile() file) {
    const fileName = file ? file.filename : null;
    return this.placeService.save(createPlaceDto, fileName);
  }

  @Post('image/:place_id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FormDataRequest()
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  async uploadImage(
    @Param('place_id') place_id: string,
    @Body() dto: PlaceImageDto,
  ) {
    return this.fileService.uploadFile(`place/${place_id}`, dto.image);
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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/place',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async put(
    @Param('uuid') uuid: string,
    @Body() updatePlaceDto: PlaceDto,
    @UploadedFile() file,
  ) {
    const fileName = file ? file.filename : null;
    return this.placeService.update(uuid, updatePlaceDto, fileName);
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('uuid') uuid: string) {
    this.placeService.remove(uuid);
  }
}
