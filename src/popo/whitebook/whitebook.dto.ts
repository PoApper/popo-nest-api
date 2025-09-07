import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
export class WhitebookDto {
  readonly title: string;
  readonly content: string;
  readonly showOnlyLogin: boolean;
  link?: string; // PDF 파일의 CloudFront URL이 들어가야 하므로 readonly 제거
  @IsFile()
  @MaxFileSize(20 * 1024 * 1024) // 20 Mb
  readonly pdfFile?: MemoryStoredFile;
}
