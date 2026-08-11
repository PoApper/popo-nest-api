import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateActivityReportDto {
  activityId: string;
  title: string;
  period: string;
  grade: string;
  major: string;
  author: string;
  memo?: string;

  // multipart/form-data 로 올라오는 원본 문서 (pdf / docx / hwpx 등)
  @IsFile()
  @MaxFileSize(20 * 1024 * 1024) // 20 MB
  readonly file?: MemoryStoredFile;
}

export class UpdateActivityReportDto {
  activityId?: string;
  title?: string;
  period?: string;
  grade?: string;
  major?: string;
  author?: string;
  memo?: string;

  // 새 파일을 올리면 교체하고, 없으면 기존 파일을 유지한다.
  @IsFile()
  @MaxFileSize(20 * 1024 * 1024)
  readonly file?: MemoryStoredFile;
}
