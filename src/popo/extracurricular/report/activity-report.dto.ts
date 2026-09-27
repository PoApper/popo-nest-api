import { IsFile, MaxFileSize, FileSystemStoredFile } from 'nestjs-form-data';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { REPORT_MAX_FILE_SIZE } from './report-file-format';

export class CreateActivityReportDto {
  @IsUUID()
  readonly activityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly period: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly grade: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly major: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly author: string;

  @IsOptional()
  @IsString()
  readonly memo?: string;

  // multipart/form-data 로 올라오는 원본 문서 (pdf / docx / hwpx 등)
  @IsFile()
  @MaxFileSize(REPORT_MAX_FILE_SIZE) // 20 MB
  readonly file: FileSystemStoredFile;
}

export class UpdateActivityReportDto extends PartialType(
  CreateActivityReportDto,
  { skipNullProperties: false },
) {}
