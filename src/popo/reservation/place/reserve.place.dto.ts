export class CreateReservePlaceDto {
  readonly place: string; // uuid of place
  readonly user: string; // uuid of user
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: number; /// yyyy-MM-dd 숫자가 되어야 조회가 쉬울 듯!
  readonly startTime: number; // hh:mm
  readonly endTime: number; // hh:mm
}
