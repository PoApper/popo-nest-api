import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class AnnouncementDto {
  readonly title: string;
  readonly memo: string | null;
  readonly start_datetime: string | null; // YYYY-MM-DD HH:mm:ss (KST)
  readonly end_datetime: string | null; // YYYY-MM-DD HH:mm:ss (KST)
  readonly link: string | null;
}

export class AnnouncementImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
