import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateActivityReportDto {
  @IsUUID()
  activityId: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  period: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  grade: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  major: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  author: string;
  @IsOptional()
  @IsString()
  memo?: string;

  // multipart/form-data 로 올라오는 원본 문서 (pdf / docx / hwpx 등)
  @IsFile()
  @MaxFileSize(20 * 1024 * 1024) // 20 MB
  readonly file: MemoryStoredFile;
}

export class UpdateActivityReportDto extends PartialType(
  CreateActivityReportDto,
) {}
