import { ReservationStatus } from '../reservation.meta';

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

/**
 * 관리자 장소 예약 목록 필터.
 * 예약 건수가 많아 생성일 순 나열만으로는 승인 대상을 찾기 어렵기 때문에 추가되었다.
 */
export class PlaceReservationFilterDto {
  readonly status?: ReservationStatus;

  readonly placeId?: string; // uuid of place

  readonly bookerId?: string; // uuid of booker

  readonly title?: string; // 예약 제목 부분 일치

  readonly date?: string; // YYYYMMDD, 지정 시 startDate/endDate 보다 우선

  readonly startDate?: string; // YYYYMMDD

  readonly endDate?: string; // YYYYMMDD

  readonly orderBy?: 'createdAt' | 'date';

  readonly orderDirection?: 'ASC' | 'DESC';
}

/**
 * 일괄 승인에서 건너뛴 예약 1건에 대한 사유.
 */
export class SkippedPlaceReservationDto {
  readonly uuid: string;

  readonly title: string;

  readonly date: string;

  readonly startTime: string;

  readonly endTime: string;

  readonly reason: string;
}

/**
 * 일괄 승인 결과 요약.
 * 중복 예약 때문에 처리가 중단되지 않고, 승인된 건과 건너뛴 건을 함께 돌려준다.
 */
export class AcceptPlaceReservationResultDto {
  readonly totalCount: number;

  readonly acceptedCount: number;

  readonly skippedCount: number;

  readonly acceptedUuidList: string[];

  readonly skippedList: SkippedPlaceReservationDto[];
}
