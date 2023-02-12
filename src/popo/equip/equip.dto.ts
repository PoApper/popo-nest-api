import { EquipOwner } from './equip.meta';

export class EquipmentDto {
  readonly name: string;
  readonly description: string;
  readonly fee: number;
  readonly equip_owner: EquipOwner;
  readonly staff_email: string;
  readonly max_minutes?: number;
}
