import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroStudentAssociationDto {
  readonly name: string;
  readonly shortDesc: string;
  readonly representative: string;
  readonly contact: string;
  readonly content: string;
  readonly location: string;
  readonly office: string;
  readonly imageUrl: string;
  readonly homepageUrl: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
  readonly youtubeUrl: string;
}

export class StudentAssociationImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
