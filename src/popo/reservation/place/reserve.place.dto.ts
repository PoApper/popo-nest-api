export class CreateReservePlaceDto {
  readonly placeId: string; // uuid of place

  readonly bookerId?: string; // uuid of booker

  readonly phone: string;

  readonly title: string;

  readonly description: string;

  readonly date: string; // YYYYMMDD

  readonly startTime: string; // hhmm

  readonly endTime: string; // hhmm
}

export class AcceptPlaceReservationListDto {
  readonly uuidList: string[];
}
