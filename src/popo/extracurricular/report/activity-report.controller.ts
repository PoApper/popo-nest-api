import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ActivityReportService } from './activity-report.service';
import {
  CreateActivityReportDto,
  UpdateActivityReportDto,
} from './activity-report.dto';
import { FileBody } from 'src/file/file-body.decorator';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { Public } from 'src/common/public-guard.decorator';

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  hwpx: 'application/hwp+zip',
  hwp: 'application/x-hwp',
};

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

  /**
   * 원본 문서를 그대로 내려준다.
   * 학생 화면의 PDF/DOCX 뷰어가 이 URL 을 직접 읽는다.
   */
  @Public()
  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName, fileType } =
      await this.reportService.getFileBuffer(id);

    res.setHeader(
      'Content-Type',
      CONTENT_TYPE_BY_EXTENSION[fileType] ?? 'application/octet-stream',
    );
    // 브라우저 내장 뷰어로 열 수 있도록 inline 으로 준다.
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @FileBody('file')
  create(@Body() dto: CreateActivityReportDto) {
    return this.reportService.create(dto);
  }

  @ApiCookieAuth()
  @Patch(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @FileBody('file')
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
