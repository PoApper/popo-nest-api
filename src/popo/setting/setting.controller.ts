import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PopoSettingDto } from './setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { UserType } from '../user/user.meta';
import { RolesGuard } from 'src/auth/authroization/roles.guard';

@ApiTags('POPO 세팅')
@Controller('setting')
export class SettingController {
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updatePopoSetting(@Body() dto: PopoSettingDto) {}

  @Get()
  getPopoSetting() {}
}
