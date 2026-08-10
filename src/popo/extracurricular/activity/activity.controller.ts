import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { Public } from 'src/common/public-guard.decorator';

@ApiTags('Extracurricular Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // 비교과활동 목록은 로그인 없이 열람할 수 있어야 한다.
  @Public()
  @Get()
  findAll(@Query('category') category?: string) {
    return this.activityService.findAll(category);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateActivityDto) {
    return this.activityService.create(dto);
  }

  @ApiCookieAuth()
  @Patch(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activityService.update(id, dto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
