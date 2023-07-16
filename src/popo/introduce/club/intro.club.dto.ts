import { ClubType } from './intro.club.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroClubDto {
  readonly name: string;
  readonly short_desc: string;
  readonly clubType: ClubType;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly contact: string;
  readonly homepage_url: string;
  readonly facebook_url: string;
  readonly instagram_url: string;
  readonly youtube_url: string;
}

export class ClubImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
