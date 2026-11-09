import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class CreateIntroStudentAssociationDto {
  readonly name: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly nameEn?: string | null;
  readonly shortDesc: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly shortDescEn?: string | null;
  readonly representative: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly representativeEn?: string | null;
  readonly contact: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly contactEn?: string | null;
  readonly content: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  readonly contentEn?: string | null;
  readonly location: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly locationEn?: string | null;
  readonly office: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  readonly officeEn?: string | null;
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
