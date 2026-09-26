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
  UsePipes,
  ValidationPipe,
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
import { pipeline } from 'stream/promises';
import { ReportDownloadGuard } from './report-download.guard';
import { REPORT_CONTENT_TYPES } from './report-file-format';

@ApiTags('Extracurricular Activity Report')
@Controller('activity-report')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
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
  @UseGuards(ReportDownloadGuard)
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, fileName, fileType } =
      await this.reportService.getFileStream(id);

    if (res.destroyed) {
      stream.destroy();
      return;
    }

    res.setHeader(
      'Content-Type',
      REPORT_CONTENT_TYPES[fileType] ?? 'application/octet-stream',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 브라우저 내장 뷰어로 열 수 있도록 inline 으로 준다.
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    // pipeline propagates backpressure and destroys the source on disconnect/error.
    try {
      await pipeline(stream, res);
    } catch (error) {
      if (!res.destroyed) throw error;
    }
  }

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.staff)
  @UseGuards(RolesGuard)
  @FileBody('file')
  create(@Body() dto: CreateActivityReportDto) {
    return this.reportService.create(dto);
  }

  @ApiCookieAuth()
  @Patch(':id')
  @Roles(UserType.admin, UserType.staff)
  @UseGuards(RolesGuard)
  @FileBody('file')
  update(@Param('id') id: string, @Body() dto: UpdateActivityReportDto) {
    return this.reportService.update(id, dto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @Roles(UserType.admin, UserType.staff)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.reportService.remove(id);
  }
}
