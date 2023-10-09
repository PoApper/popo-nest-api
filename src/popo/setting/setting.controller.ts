import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PopoSettingDto } from './setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { UserType } from '../user/user.meta';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { FileService } from '../../file/file.service';

@ApiTags('POPO 세팅')
@Controller('setting')
export class SettingController {
  constructor(private readonly fileService: FileService) {}
  
  @Get()
  async getSetting() {
    return this.fileService.getText('popo-setting.json');
  }
  

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updatePopoSetting(@Body() dto: PopoSettingDto) {
    const settingKey = 'popo-setting.json';
    return this.fileService.uploadText(settingKey, JSON.stringify(dto));
  }
}
