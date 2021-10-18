import { EquipOwner } from '../../equip/equip.meta';

export class CreateReserveEquipDto {
  readonly equips: string[]; // uuids of equips
  readonly user: string; // uuid of user
  readonly owner: EquipOwner; // equip-owner
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly startTime: number; // hh:mm
  readonly endTime: number; // hh:mm
}
