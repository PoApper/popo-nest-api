import { EquipOwner } from '../../equip/equip.meta';
import { ReservationStatus } from '../reservation.meta';

export class CreateReserveEquipDto {
  readonly equipments: string[]; // Array of equipment uuids
  readonly bookerId?: string; // uuid of booker
  readonly owner: EquipOwner; // equip-owner
  readonly phone: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // YYYYMMDD
  readonly startTime: string; // hhmm
  readonly endTime: string; // hhmm
}

export class AcceptEquipReservationListDto {
  readonly uuidList: string[];
}

/**
 * 관리자 장비 예약 목록 필터.
 */
export class EquipReservationFilterDto {
  readonly owner?: EquipOwner;

  readonly status?: ReservationStatus;

  readonly bookerId?: string; // uuid of booker

  readonly title?: string; // 예약 제목 부분 일치

  readonly date?: string; // YYYYMMDD, 지정 시 startDate/endDate 보다 우선

  readonly startDate?: string; // YYYYMMDD

  readonly endDate?: string; // YYYYMMDD

  readonly orderBy?: 'createdAt' | 'date';

  readonly orderDirection?: 'ASC' | 'DESC';
}

export class SkippedEquipReservationDto {
  readonly uuid: string;

  readonly title: string;

  readonly date: string;

  readonly startTime: string;

  readonly endTime: string;

  readonly reason: string;
}

export class AcceptEquipReservationResultDto {
  readonly totalCount: number;

  readonly acceptedCount: number;

  readonly skippedCount: number;

  readonly acceptedUuidList: string[];

  readonly skippedList: SkippedEquipReservationDto[];
}
