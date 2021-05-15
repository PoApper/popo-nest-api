export class CreateReserveEquipDto {
  readonly equips: string[]; // uuids of equips
  readonly user: string; // id of user
  readonly owner: string; // info of equip-owner
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: number; /// yyyy-MM-dd 숫자가 되어야 조회가 쉬울 듯!
  readonly startTime: number; // hh:mm
  readonly endTime: number; // hh:mm
}