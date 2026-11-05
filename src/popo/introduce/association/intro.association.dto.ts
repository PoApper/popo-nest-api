import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import { AssociationType } from './intro.association.meta';

export class CreateIntroAssociationDto {
  readonly name: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly nameEn?: string | null;
  readonly associationType: AssociationType;
  readonly content: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  readonly contentEn?: string | null;
  readonly location: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly locationEn?: string | null;
  readonly representative: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly representativeEn?: string | null;
  readonly contact: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly contactEn?: string | null;
  readonly homepageUrl: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
}

export class AssociationImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
