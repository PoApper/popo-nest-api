export class CreateReserveEquipDto {
  readonly equip: string; // uuid
  readonly user: string; // uuid
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: number; /// yyyy-MM-dd 숫자가 되어야 조회가 쉬울 듯!
  readonly startTime: number; // hh:mm
  readonly endTime: number; // hh:mm
}