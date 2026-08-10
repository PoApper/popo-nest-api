import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityReportService } from './activity-report.service';
import { CreateActivityReportDto, UpdateActivityReportDto } from './activity-report.dto';

@ApiTags('Extracurricular Activity Report')
@Controller('activity-report')
export class ActivityReportController {
  constructor(private readonly reportService: ActivityReportService) {}

  @Get()
  findAll(
    @Query('activityId') activityId?: string,
    @Query('period') period?: string,
    @Query('major') major?: string,
  ) {
    return this.reportService.findAll({ activityId, period, major });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateActivityReportDto) {
    return this.reportService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityReportDto) {
    return this.reportService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportService.remove(id);
  }
}
