import { EquipOwner } from '../../equip/equip.meta';

export class CreateReserveEquipDto {
  readonly equipments: string[]; // Array of equipment uuids
  readonly bookerId?: string; // uuid of booker
  readonly owner: EquipOwner; // equip-owner
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly startTime: string; // hhmm
  readonly endTime: string; // hhmm
}
