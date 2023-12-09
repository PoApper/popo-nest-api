import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class NoticeDto {
  readonly title: string;
  readonly memo: string | null;
  readonly start_datetime: string | null; // YYYY-MM-DD HH:mm:ss (KST)
  readonly end_datetime: string | null; // YYYY-MM-DD HH:mm:ss (KST)
  readonly link: string | null;
}

export class NoticeImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
