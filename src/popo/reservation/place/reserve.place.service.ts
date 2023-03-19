import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { PlaceService } from '../../place/place.service';
import { ReservationStatus } from '../reservation.meta';
import { PlaceRegion } from '../../place/place.meta';
import * as moment from 'moment';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such place.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
  NOT_ENOUGH_INFORMATION: "There's no enough information about reservation",
  BAD_RESERVATION_TIME: 'Reservation time is not appropriate.',
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

  isOverMaxMinutes(
    max_minutes: number,
    start_time: string,
    end_time: string,
  ): boolean {
    const startMoment = moment(start_time, 'hhmm');
    const endMoment = moment(end_time, 'hhmm');
    const minutesDiff = moment
      .duration(endMoment.diff(startMoment))
      .asMinutes();

    return max_minutes && minutesDiff > max_minutes;
  }

  async save(dto: CreateReservePlaceDto) {
    const { place_id, date, start_time, end_time } = dto;

    if (
      dto.title === '' ||
      dto.phone === '' ||
      dto.booker_id === '' ||
      dto.description === ''
    ) {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }

    const existPlace = await this.placeService.findOneOrFail(place_id);

    const isOverMaxMinutes = this.isOverMaxMinutes(
      existPlace.max_minutes,
      start_time,
      end_time,
    );
    if (isOverMaxMinutes) {
      throw new BadRequestException(Message.BAD_RESERVATION_TIME);
    }

    const isReservationOverlap = await this.isReservationOverlap(
      place_id,
      date,
      start_time,
      end_time,
    );
    if (isReservationOverlap) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    let saveDto = Object.assign({}, dto);
    if (existPlace.region === PlaceRegion.community_center) {
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

  findOne(uuid: string) {
    return this.reservePlaceRepo.findOne(uuid);
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

    console.log(findOption);

    return this.reservePlaceRepo.find(findOption);
  }

  async findAllByPlaceNameAndDate(placeName: string, date: string) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return this.reservePlaceRepo.find({
      place_id: existPlace.uuid,
      date: date,
    });
  }

  async updateStatus(uuid: string, status: ReservationStatus) {
    const existReserve = await this.findOne(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION);
    }

    this.reservePlaceRepo.update(
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
      const booker = await this.userService.findOne(reservation.booker_id);
      if (booker) {
        const { password, cryptoSalt, ...booker_info } = booker;
        reservation.booker = booker_info;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }

  async joinPlace(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const place = await this.placeService.findOne(reservation.place_id);
      if (place) {
        reservation.place = place;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }
}
