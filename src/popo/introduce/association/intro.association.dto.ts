import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroAssociationDto {
  readonly name: string;
  readonly content: string;
  readonly location: string;
  readonly representative: string;
  readonly contact: string;
  readonly homepage_url: string;
  readonly facebook_url: string;
  readonly instagram_url: string;
}

export class AssociationImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
