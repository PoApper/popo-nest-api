import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { PopoSettingDto, RcStudentsListDto } from './setting.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { UserType } from '../user/user.meta';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';
import { FileBody } from '../../file/file-body.decorator';
import { SettingService } from './setting.service';
import { Public } from '../../common/public-guard.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('POPO 세팅')
@Controller('setting')
export class SettingController {
  constructor(
    private readonly fileService: FileService,
    private readonly settingService: SettingService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  async getSetting() {
    return this.fileService.getText('popo-setting.json');
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Post()
  updatePopoSetting(@Body() dto: PopoSettingDto) {
    const settingKey =
      this.configService.get('NODE_ENV') == 'prod'
        ? 'popo-setting.json'
        : 'popo-setting-dev.json';
    return this.fileService.uploadText(settingKey, JSON.stringify(dto));
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Post('rc-students-list')
  @FileBody('csv_file')
  async uploadRcStudentList(@Body() dto: RcStudentsListDto) {
    if (!dto.csv_file) {
      throw new BadRequestException('csv_file is required');
    }
    const csv_url = await this.fileService.uploadFile(
      'popo-rc-students-list.csv',
      dto.csv_file,
    );
    return csv_url;
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Get('download-rc-students-list')
  async downloadRcStudentList(@Res() res: Response) {
    const data = await this.fileService.getFile('popo-rc-students-list.csv');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rc-students-list.csv"`,
    );
    res.send(data);
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Get('count-rc-students-list')
  async countRcStudentList() {
    return this.settingService.countRcStudentsList();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Get('get-rc-students-status')
  async getRcStudentStatus() {
    return this.settingService.getRcStudentsStatus();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @Get('sync-rc-students-list')
  async checkRc() {
    await this.settingService.resetRcStudentsUserType();
    return this.settingService.setRcStudentsUserTypeByCsv();
  }
}
