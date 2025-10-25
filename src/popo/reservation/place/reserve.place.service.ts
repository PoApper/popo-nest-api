import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import {
  DeepPartial,
  In,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { PlaceService } from '../../place/place.service';
import { ReservationStatus } from '../reservation.meta';
import { PlaceEnableAutoAccept, PlaceRegion } from '../../place/place.meta';
import {
  calculateReservationDurationMinutes,
  timeStringToMinutes,
} from '../../../utils/reservation-utils';
import { UserType } from 'src/popo/user/user.meta';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such place.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
  NOT_ENOUGH_INFORMATION: "There's no enough information about reservation",
  OVER_MAX_RESERVATION_TIME:
    'Over the allocated reservation minutes of that day.',
};

@Injectable()
export class ReservePlaceService {
  constructor(
    @InjectRepository(ReservePlace)
    private readonly reservePlaceRepo: Repository<ReservePlace>,
    private readonly userService: UserService,
    private readonly placeService: PlaceService,
  ) {}

  // TODO: delete this code, after concurrent check logic is fully validated
  async isReservationOverlap(
    placeId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<ReservePlace | null> {
    const booked_reservations = await this.find({
      where: {
        placeId: placeId,
        date: date,
        status: ReservationStatus.accept,
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
    });

    for (const reservation of booked_reservations) {
      const isOverlap =
        reservation.startTime < endTime && startTime < reservation.endTime;

      if (isOverlap) {
        return reservation;
      }
    }
    return null;
  }

  async isReservationConcurrent(
    placeId: string,
    maxConcurrentReservation: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    // Fetch all accepted reservations for that day and place,
    // and compute overlaps in minutes to correctly handle end='0000' (24:00)
    const booked_reservations = await this.reservePlaceRepo.find({
      where: {
        placeId: placeId,
        date: date,
        status: ReservationStatus.accept,
      },
      order: { startTime: 'ASC' },
    });

    function _get_concurrent_cnt_at_time(time: string) {
      let cnt = 0;
      const t = timeStringToMinutes(time, false);
      for (const reservation of booked_reservations) {
        const s = timeStringToMinutes(reservation.startTime, false);
        const e = timeStringToMinutes(reservation.endTime, true);
        // Use half-open interval [s, e) to avoid double counting boundary equals
        if (s <= t && t < e) {
          cnt += 1;
        }
      }
      return cnt;
    }

    // 1. check start time reservation is possible
    if (_get_concurrent_cnt_at_time(startTime) >= maxConcurrentReservation) {
      return false;
    }

    // 2. check end time reservation is possible
    if (_get_concurrent_cnt_at_time(endTime) >= maxConcurrentReservation) {
      return false;
    }

    // 3. check middle time reservation is possible: they should be less than maxConcurrentReservation
    for (const reservation of booked_reservations) {
      const s = reservation.startTime;
      const e = reservation.endTime;

      // handled on case 1
      if (s < startTime) continue;

      // handled on case 2
      if (e > endTime) continue;

      // startTime ~ endTime 사이에 "기존 예약 개수"가 maxConcurrentReservation 이상인지 확인
      if (
        _get_concurrent_cnt_at_time(s) >= maxConcurrentReservation ||
        _get_concurrent_cnt_at_time(e) >= maxConcurrentReservation
      ) {
        return false;
      }
    }

    return true;
  }

  async checkReservationPossible(
    dto: DeepPartial<CreateReservePlaceDto>,
    bookerId: string,
    isPatch: boolean = true,
  ) {
    const { placeId, date, startTime, endTime } = dto;

    if (dto.title === '' || dto.phone === '' || dto.description === '') {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }

    const targetPlace = await this.placeService.findOneByUuidOrFail(placeId);

    // TODO: delete this code, after concurrent check logic is fully validated
    // Reservation Overlap Check
    // const isReservationOverlap = await this.isReservationOverlap(
    //   place_id,
    //   date,
    //   start_time,
    //   end_time,
    // );
    // if (isReservationOverlap) {
    //   throw new BadRequestException(
    //     `${Message.OVERLAP_RESERVATION}: ${isReservationOverlap.date} ${isReservationOverlap.start_time} ~ ${isReservationOverlap.end_time}`
    //   );
    // }

    // Reservation Concurrent Check
    const isConcurrentPossible = await this.isReservationConcurrent(
      placeId,
      targetPlace.maxConcurrentReservation,
      date,
      startTime,
      endTime,
    );
    if (!isConcurrentPossible) {
      throw new BadRequestException(
        `"${targetPlace.name}" 장소에 이미 승인된 ${targetPlace.maxConcurrentReservation}개 예약이 있어 ${date} ${startTime} ~ ${endTime}에는 예약이 불가능 합니다.`,
      );
    }

    // Reservation Duration Check
    const newReservationMinutes = calculateReservationDurationMinutes(
      startTime,
      endTime,
    );
    if (
      targetPlace.maxMinutes &&
      newReservationMinutes > targetPlace.maxMinutes
    ) {
      throw new BadRequestException(
        `${Message.OVER_MAX_RESERVATION_TIME}: "${targetPlace.name}" 장소는 하루 최대 ${targetPlace.maxMinutes}분 동안 예약할 수 있습니다. 신규 예약은 ${newReservationMinutes}분으로 최대 예약 시간을 초과합니다.`,
      );
    }

    const booker = await this.userService.findOneByUuidOrFail(bookerId);

    if (
      targetPlace.region === PlaceRegion.residential_college &&
      !(
        booker.userType === UserType.rc_student ||
        booker.userType === UserType.admin
      )
    ) {
      throw new BadRequestException(
        `"${targetPlace.name}" 장소는 RC 학생만 예약할 수 있습니다.`,
      );
    }

    const reservationsOfDay = await this.reservePlaceRepo.find({
      where: {
        bookerId: bookerId,
        placeId: placeId,
        date: date,
        status: In(
          isPatch
            ? [ReservationStatus.accept]
            : [ReservationStatus.accept, ReservationStatus.in_process],
        ),
      },
    });

    let totalReservationMinutes = 0;
    for (const reservation of reservationsOfDay) {
      const reservationDuration = calculateReservationDurationMinutes(
        reservation.startTime,
        reservation.endTime,
      );
      totalReservationMinutes += reservationDuration;
    }

    if (
      totalReservationMinutes + newReservationMinutes >
      targetPlace.maxMinutes
    ) {
      throw new BadRequestException(
        `${Message.OVER_MAX_RESERVATION_TIME}: ` +
          `"${targetPlace.name}" 장소에 대해 하루 최대 예약 가능한 ${targetPlace.maxMinutes}분 중에서 ` +
          `오늘(${date}) ${totalReservationMinutes}분을 이미 예약했습니다. ` +
          `신규로 ${newReservationMinutes}분을 예약하는 것은 불가능합니다.`,
      );
    }
  }

  async save(dto: CreateReservePlaceDto) {
    const targetPlace = await this.placeService.findOneByUuidOrFail(
      dto.placeId,
    );

    let saveDto = Object.assign({}, dto);
    if (targetPlace.enableAutoAccept === PlaceEnableAutoAccept.active) {
      saveDto = Object.assign(dto, { status: ReservationStatus.accept });
    }

    return this.reservePlaceRepo.save(saveDto);
  }

  find(findOptions?: object) {
    return this.reservePlaceRepo.find(findOptions);
  }

  count(whereOption?: object) {
    return this.reservePlaceRepo.count({ where: whereOption });
  }

  findOneByUuid(uuid: string) {
    return this.reservePlaceRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.reservePlaceRepo.findOneByOrFail({ uuid: uuid });
  }

  async findAllByPlaceName(placeName: string, startDate?: string) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const findOption = {
      placeId: existPlace.uuid,
    };

    if (startDate) {
      findOption['date'] = MoreThanOrEqual(startDate);
    }

    return this.reservePlaceRepo.findBy(findOption);
  }

  async findAllByPlaceNameAndDate(placeName: string, date: string) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return this.reservePlaceRepo.findBy({
      placeId: existPlace.uuid,
      date: date,
    });
  }

  async updateStatus(uuid: string, status: ReservationStatus) {
    const existReserve = await this.findOneByUuidOrFail(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION);
    }

    await this.reservePlaceRepo.update(
      { uuid: uuid },
      {
        status: status,
      },
    );

    const existUser = await this.userService.findOneByUuid(
      existReserve.bookerId,
    );

    return {
      userType: existUser.userType,
      email: existUser.email,
      title: existReserve.title,
    };
  }

  remove(uuid: string) {
    return this.reservePlaceRepo.delete(uuid);
  }

  async joinBooker(reservations) {
    const refinedReservations = [];

    for (const reservation of reservations) {
      const booker = await this.userService.findOneByUuidWithInfo(
        reservation.bookerId,
      );
      if (booker) {
        reservation.booker = booker;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }

  async joinPlace(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const place = await this.placeService.findOneByUuid(reservation.placeId);
      if (place) {
        reservation.place = place;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }
}
