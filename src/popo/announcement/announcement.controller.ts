import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';

import { AnnouncementService } from './announcement.service';
import { AnnouncementDto, AnnouncementImageDto } from './announcement.dto';
import { UserType } from '../user/user.meta';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';
import { FileBody } from '../../file/file-body.decorator';

@ApiTags('Announcement')
@Controller('announcement')
export class AnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: AnnouncementDto })
  async create(@Body() dto: AnnouncementDto) {
    return this.announcementService.save(dto);
  }

  @Post('image/:id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @FileBody('image')
  async uploadImage(@Param('id') id: number, @Body() dto: AnnouncementImageDto) {
    const image_url = await this.fileService.uploadFile(
      `announcement/${id}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.announcementService.updateImageUrl(id, image_url);
    return image_url;
  }

  @Get()
  getAll() {
    return this.announcementService.find();
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.announcementService.findOneById(id);
  }
  
  @Patch('click/:id')
  increaseClickCount(@Param('id') id: number) {
    return this.announcementService.increaseClickCount(id);
  }

  @Put(':id')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async put(@Param('id') id: number, @Body() updateAnnouncementDto: AnnouncementDto) {
    return this.announcementService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    this.announcementService.remove(id);
  }
}
