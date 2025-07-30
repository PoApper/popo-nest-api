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
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';

import { NoticeService } from './notice.service';
import { NoticeDto, NoticeImageDto } from './notice.dto';
import { UserType } from '../user/user.meta';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';
import { FileBody } from '../../file/file-body.decorator';
import { Public } from '../../common/public-guard.decorator';

@ApiTags('Notice: 사용하지 않는 API')
@Controller('notice')
export class NoticeController {
  constructor(
    private readonly noticeService: NoticeService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @ApiBody({ type: NoticeDto })
  async create(@Body() dto: NoticeDto) {
    return this.noticeService.save(dto);
  }

  @ApiCookieAuth()
  @Post('image/:id')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @FileBody('image')
  async uploadImage(@Param('id') id: number, @Body() dto: NoticeImageDto) {
    const image_url = await this.fileService.uploadFile(
      `notice/${id}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.noticeService.updateImageUrl(id, image_url);
    return image_url;
  }

  @Public()
  @Get()
  getAll() {
    return this.noticeService.find();
  }

  @Public()
  @Get('active')
  getAllActive() {
    return this.noticeService.findActive();
  }

  @Public()
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.noticeService.findOneById(id);
  }

  @Public()
  @Patch('click/:id')
  increaseClickCount(@Param('id') id: number) {
    return this.noticeService.increaseClickCount(id);
  }

  @ApiCookieAuth()
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  async put(@Param('id') id: number, @Body() updateNoticeDto: NoticeDto) {
    return this.noticeService.update(id, updateNoticeDto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  async delete(@Param('id') id: number) {
    this.noticeService.remove(id);
  }
}
