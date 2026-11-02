import { PlaceEnableAutoAccept, PlaceRegion } from './place.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceDto {
  readonly name: string;
  @ApiPropertyOptional({ type: String, maxLength: 255, nullable: true })
  readonly nameEn?: string | null;
  readonly description: string;
  readonly location: string;
  readonly region: PlaceRegion;
  readonly staffEmail: string;
  readonly maxMinutes: number;
  readonly maxConcurrentReservation: number;
  readonly reservationRequiredDays?: number;
  readonly openingHours: string;
  readonly enableAutoAccept: PlaceEnableAutoAccept;
}

export class PlaceImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
