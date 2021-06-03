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
import {EquipService} from "./equip.service";
import {diskStorage} from 'multer';
import {Roles} from "../../auth/authroization/roles.decorator";
import {UserType} from "../user/user.meta";
import {JwtAuthGuard} from "../../auth/guards/jwt-auth.guard";
import {RolesGuard} from "../../auth/authroization/roles.guard";
import {FileInterceptor} from "@nestjs/platform-express";
import {editFileName, imageFileFilter} from "../../utils/fileUpload";
import {EquipOwner} from "./equip.meta";
import {CreateEquipDto} from "./equip.dto";

@Controller('equip')
export class EquipController {
  constructor(private readonly equipService: EquipService) {
  }

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: "./uploads/equip",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  async create(@Body() dto: CreateEquipDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.equipService.save(dto, fileName);
  }

  @Get()
  get() {
    return this.equipService.find({order: {updatedAt: "DESC"}});
  }

  @Get('/:uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.equipService.findOne({uuid: uuid});
  }

  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.equipService.findOneByName(name);
  }

  @Get('/image/:imageName')
  getPlaceImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, {root: './uploads/equip'});
  }

  @Get('/owner/:owner')
  async getAllByOwner(@Param('owner') owner: EquipOwner) {
    return this.equipService.findAllByOwner(owner);
  }

  @Put(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: "./uploads/equip",
        filename: editFileName
      }), fileFilter: imageFileFilter
    })
  )
  async put(@Param('uuid') uuid: string, @Body() dto: CreateEquipDto, @UploadedFile() file) {
    const fileName = (file) ? file.filename : null;
    return this.equipService.update(uuid, dto, fileName);
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('uuid') uuid: string) {
    return this.equipService.delete(uuid);
  }
}
