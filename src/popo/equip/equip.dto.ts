import { EquipOwner } from './equip.meta';
import { IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';

export class EquipmentDto {
  readonly name: string;
  readonly description: string;
  readonly fee: number;
  readonly equip_owner: EquipOwner;
  readonly staff_email: string;
  readonly max_minutes?: number;
}

export class EquipmentImageDto {
  @IsFile()
  @MaxFileSize(10 * 1024 * 1024) // 10MB
  readonly image: MemoryStoredFile;
}
