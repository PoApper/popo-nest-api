import { ClubType } from './intro.club.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroClubDto {
  readonly name: string;
  readonly shortDesc: string;
  readonly clubType: ClubType;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly contact: string;
  readonly homepageUrl: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
  readonly youtubeUrl: string;
}

export class ClubImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
