import {EquipOwner} from "./equip.meta";

export class CreateEquipDto {
  readonly name: string;
  readonly description: string;
  readonly fee: number;
  readonly equipOwner: EquipOwner;
  readonly equipStaff: string;
}