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

  @Post('image/:uuid')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FileBody('image')
  async uploadImage(
    @Param('uuid') uuid: string,
    @Body() dto: EquipmentImageDto,
  ) {
    const image_url = await this.fileService.uploadFile(
      `equip/${uuid}`,
      dto.image,
    );
    await this.equipService.updateImageUrl(uuid, image_url);
    return image_url;
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
