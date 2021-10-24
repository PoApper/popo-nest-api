import { EquipOwner } from '../../equip/equip.meta';

export class CreateReserveEquipDto {
  readonly equips: string[]; // uuids of equips
  readonly booker_id?: string; // uuid of booker
  readonly owner: EquipOwner; // equip-owner
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly start_time: number; // hh:mm
  readonly end_time: number; // hh:mm
}
