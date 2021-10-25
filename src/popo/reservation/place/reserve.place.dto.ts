export class CreateReservePlaceDto {
  readonly place: string; // uuid of place
  readonly booker_id?: string; // uuid of booker
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly start_time: number; // hh:mm
  readonly end_time: number; // hh:mm
}
