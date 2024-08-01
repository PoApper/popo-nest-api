export class CreateReservePlaceDto {
  readonly place_id: string; // uuid of place

  readonly booker_id?: string; // uuid of booker

  readonly phone: string;

  readonly title: string;

  readonly description: string;

  readonly date: string; // YYYYMMDD

  readonly start_time: string; // hhmm

  readonly end_time: string; // hhmm
}

export class AcceptPlaceReservationListDto {
  readonly uuid_list: string[];
}
