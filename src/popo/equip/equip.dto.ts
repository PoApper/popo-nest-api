import { EquipOwner } from './equip.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EquipmentDto {
  readonly name: string;
  @ApiPropertyOptional({ type: String, maxLength: 255, nullable: true })
  readonly nameEn?: string | null;
  readonly description: string;
  readonly fee: number;
  readonly equipOwner: EquipOwner;
  readonly staffEmail: string;
  readonly maxMinutes?: number;
  readonly reservationRequiredDays?: number;
  readonly openingHours: string;
}

export class EquipmentImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
