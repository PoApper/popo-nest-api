import { EquipOwner } from './equip.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class EquipmentDto {
  readonly name: string;
  readonly description: string;
  readonly fee: number;
  readonly equipOwner: EquipOwner;
  readonly staffEmail: string;
  readonly maxMinutes?: number;
  readonly openingHours: string;
}

export class EquipmentImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
