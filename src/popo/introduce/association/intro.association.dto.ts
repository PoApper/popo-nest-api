import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroAssociationDto {
  readonly name: string;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly categoryId: number;
  readonly contact: string;
  readonly homepageUrl: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
}

export class AssociationImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
