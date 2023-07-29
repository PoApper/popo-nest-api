import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { PlaceService } from '../../place/place.service';
import { ReservationStatus } from '../reservation.meta';
import { PlaceEnableAutoAccept } from '../../place/place.meta';
import { calculateReservationDurationMinutes } from '../../../utils/reservation-utils';

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

  async isReservationOverlap(
    place_id: string,
    date: string,
    start_time: string,
    end_time: string,
  ): Promise<boolean> {
    const booked_reservations = await this.find({
      place_id: place_id,
      date: date,
      status: ReservationStatus.accept,
    });

    for (const reservation of booked_reservations) {
      const isOverlap =
        reservation.start_time < end_time && start_time < reservation.end_time;

      if (isOverlap) {
        return true;
      }
    }
    return false;
  }

  async save(dto: CreateReservePlaceDto) {
    const { place_id, date, start_time, end_time, booker_id } = dto;

    if (
      dto.title === '' ||
      dto.phone === '' ||
      dto.booker_id === '' ||
      dto.description === ''
    ) {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }

    const targetPlace = await this.placeService.findOneByUuidOrFail(place_id);

    // Reservation Overlap Check
    const isReservationOverlap = await this.isReservationOverlap(
      place_id,
      date,
      start_time,
      end_time,
    );
    if (isReservationOverlap) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    // Reservation Duration Check
    const newReservationMinutes = calculateReservationDurationMinutes(
      dto.start_time,
      dto.end_time,
    );
    if (
      targetPlace.max_minutes &&
      newReservationMinutes > targetPlace.max_minutes
    ) {
      throw new BadRequestException(
        `${Message.OVER_MAX_RESERVATION_TIME}: max ${targetPlace.max_minutes} mins, new ${newReservationMinutes} mins`,
      );
    }

    const reservationsOfDay = await this.reservePlaceRepo.find({
      where: {
        booker_id: booker_id,
        place_id: place_id,
        date: date,
        status: In([ReservationStatus.accept, ReservationStatus.in_process]),
      },
    });

    let totalReservationMinutes = 0;
    for (const reservation of reservationsOfDay) {
      const reservationDuration = calculateReservationDurationMinutes(
        reservation.start_time,
        reservation.end_time,
      );
      totalReservationMinutes += reservationDuration;
    }

    if (
      totalReservationMinutes + newReservationMinutes >
      targetPlace.max_minutes
    ) {
      throw new BadRequestException(
        `${Message.OVER_MAX_RESERVATION_TIME}: max ${targetPlace.max_minutes} mins, today ${totalReservationMinutes} mins, new ${newReservationMinutes} mins`,
      );
    }

    let saveDto = Object.assign({}, dto);
    if (targetPlace.enable_auto_accept === PlaceEnableAutoAccept.active) {
      saveDto = Object.assign(dto, { status: ReservationStatus.accept });
    }

    return this.reservePlaceRepo.save(saveDto);
  }

  find(findOptions?: object) {
    return this.reservePlaceRepo.find(findOptions);
  }

  count(findOptions?: object) {
    return this.reservePlaceRepo.count(findOptions);
  }

  findOneByUuid(uuid: string) {
    return this.reservePlaceRepo.findOneBy({ uuid: uuid});
  }

  findOneByUuidOrFail(uuid: string) {
    return this.reservePlaceRepo.findOneByOrFail({ uuid: uuid});
  }

  async findAllByPlaceName(placeName: string, startDate?: string) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const findOption = {
      place_id: existPlace.uuid,
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
      place_id: existPlace.uuid,
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

    const existUser = await this.userService.findOne({
      uuid: existReserve.booker_id,
    });

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
        reservation.booker_id,
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
      const place = await this.placeService.findOneByUuid(reservation.place_id);
      if (place) {
        reservation.place = place;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }
}
