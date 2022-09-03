export class CreateReservePlaceDto {
  readonly place_id: string; // uuid of place
  readonly booker_id?: string; // uuid of booker
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly start_time: string; // hh:mm
  readonly end_time: string; // hh:mm
}

export class AcceptPlaceReservationListDto {
  readonly uuid_list: string[];
}
