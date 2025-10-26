import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import { DeepPartial, In, MoreThanOrEqual, Repository } from 'typeorm';
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

  async isReservationConcurrent(
    placeId: string,
    maxConcurrentReservation: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    // 라인스위핑으로 동시 예약 개수 체크

    const accepted = await this.reservePlaceRepo.find({
      where: { placeId: placeId, date: date, status: ReservationStatus.accept },
      order: { startTime: 'ASC' },
    });

    const S = timeStringToMinutes(startTime, false);
    const E = timeStringToMinutes(endTime, true); // 0000 => 1440

    enum EventLabel {
      END = -1,
      START = 1,
    }
    type Event = { t: number; label: EventLabel };

    const events: Event[] = [];

    for (const r of accepted) {
      const s = timeStringToMinutes(r.startTime, false);
      const e = timeStringToMinutes(r.endTime, true);
      // 요청받은 예약과 겹쳐서 고려해야 하는 예약만 넣음
      const cs = Math.max(s, S);
      const ce = Math.min(e, E);
      if (cs < ce) {
        events.push({ t: cs, label: EventLabel.START });
        events.push({ t: ce, label: EventLabel.END });
      }
    }

    events.push({ t: S, label: EventLabel.START });
    events.push({ t: E, label: EventLabel.END });

    // 시간 순으로 정렬, END(-1)가 START(+1)보다 앞에 와서 END와 START가 겹쳐도 처리 가능하도록 함
    events.sort((a, b) => a.t - b.t || a.label - b.label);

    let cnt = 0;
    for (const ev of events) {
      cnt += ev.label;
      if (cnt > maxConcurrentReservation) return false;
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
