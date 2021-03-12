import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from 'multer';
import {PlaceService} from "./place.service";
import {CreatePlaceDto} from "./place.dto";
import {PlaceRegion} from "./place.meta";
import {UserType} from "../user/user.meta";
import {JwtAuthGuard} from "../../auth/guards/jwt-auth.guard";
import {Roles} from "../../auth/authroization/roles.decorator";
import {RolesGuard} from "../../auth/authroization/roles.guard";
import {imageFileFilter, editFileName} from "../../utils/fileUpload"

@Controller('place')
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {
  }

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: "./uploads/place",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  async create(@Body() createPlaceDto: CreatePlaceDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.placeService.save(createPlaceDto, fileName);
  }

  @Get()
  getAll() {
    return this.placeService.find();
  }

  @Get('/:uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.placeService.findOne(uuid);
  }

  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.placeService.findOneByName(name);
  }

  @Get('/image/:imageName')
  getPlaceImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, {root: './uploads/place'});
  }

  @Get('/region/:region')
  async getAllByRegion(@Param('region') region: PlaceRegion) {
    return this.placeService.findAllByRegion(region);
  }

  @Get('/owner/:owner_uuid')
  async getAllByOwner(@Param('owner_uuid') owner_uuid: string) {
    return this.placeService.findAllByOwner(owner_uuid);
  }

  @Put(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: "./uploads/place",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  async put(@Param('uuid') uuid: string, @Body() updatePlaceDto: CreatePlaceDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.placeService.update(uuid, updatePlaceDto, fileName);
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('uuid') uuid: string) {
    this.placeService.remove(uuid);
  }
}
