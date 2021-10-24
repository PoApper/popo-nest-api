export class CreateReservePlaceDto {
  readonly place: string; // uuid of place
  readonly user: string; // uuid of user
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly start_time: number; // hh:mm
  readonly end_time: number; // hh:mm
}
