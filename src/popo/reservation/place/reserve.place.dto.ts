import { ApiProperty } from '@nestjs/swagger'

export class CreateReservePlaceDto {
  @ApiProperty()
  readonly place_id: string; // uuid of place

  @ApiProperty()
  readonly booker_id?: string; // uuid of booker

  @ApiProperty()
  readonly phone: string;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly date: string; // YYYYMMDD

  @ApiProperty()
  readonly start_time: string; // hhmm

  @ApiProperty()
  readonly end_time: string; // hhmm
}

export class AcceptPlaceReservationListDto {
  @ApiProperty()
  readonly uuid_list: string[];
}
