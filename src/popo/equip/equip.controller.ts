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

import { EquipService } from './equip.service';
import { EquipOwner } from './equip.meta';
import { EquipmentDto, EquipmentImageDto } from './equip.dto';
import { Roles } from '../../auth/authroization/roles.decorator';
import { UserType } from '../user/user.meta';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { FileBody } from '../../file/file-body.decorator';
import { FileService } from '../../file/file.service';

@ApiTags('Equipment')
@Controller('equip')
@UseInterceptors(CacheInterceptor)
export class EquipController {
  constructor(
    private readonly equipService: EquipService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: EquipmentDto })
  async create(@Body() dto: EquipmentDto) {
    return this.equipService.save(dto);
  }

  @Post('image/:equip_id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FileBody('image')
  async uploadImage(
    @Param('equip_id') equip_id: string,
    @Body() dto: EquipmentImageDto,
  ) {
    return this.fileService.uploadFile(`equip/${equip_id}`, dto.image);
  }

  @Get()
  get() {
    return this.equipService.find({ order: { updatedAt: 'DESC' } });
  }

  @Get('/:uuid')
  async getOne(@Param('uuid') uuid: string) {
    return this.equipService.findOne({ uuid: uuid });
  }

  @Get('/name/:name')
  async getOneByName(@Param('name') name: string) {
    return this.equipService.findOneByName(name);
  }

  @Get('/image/:imageName')
  getPlaceImage(@Param('imageName') imageName: string, @Res() res) {
    res.sendFile(imageName, { root: './uploads/equip' });
  }

  @Get('/owner/:owner')
  async getAllByOwner(@Param('owner') owner: EquipOwner) {
    return this.equipService.findAllByOwner(owner);
  }

  @Put(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async put(@Param('uuid') uuid: string, @Body() dto: EquipmentDto) {
    return this.equipService.update(uuid, dto);
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('uuid') uuid: string) {
    return this.equipService.delete(uuid);
  }
}
