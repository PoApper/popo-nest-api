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
import { ActivityReportService } from './activity-report.service';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { Public } from 'src/common/public-guard.decorator';

@ApiTags('Extracurricular Activity Report')
@Controller('activity-report')
export class ActivityReportController {
  constructor(private readonly reportService: ActivityReportService) {}

  // 활동 수기는 로그인 없이 열람할 수 있어야 한다.
  @Public()
  @Get()
  findAll(
    @Query('activityId') activityId?: string,
    @Query('period') period?: string,
    @Query('major') major?: string,
  ) {
    return this.reportService.findAll({ activityId, period, major });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateActivityReportDto) {
    return this.reportService.create(dto);
  }

  @ApiCookieAuth()
  @Patch(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateActivityReportDto) {
    return this.reportService.update(id, dto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.reportService.remove(id);
  }
}
