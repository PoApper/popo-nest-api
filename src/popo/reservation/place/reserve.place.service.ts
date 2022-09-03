import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import { Repository } from 'typeorm';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { PlaceService } from '../../place/place.service';
import { ReservationStatus } from '../reservation.meta';
import { PlaceRegion } from '../../place/place.meta';

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

  async checkPossible(place_id, date, start_time, end_time): Promise<boolean> {
    const booked_reservations = await this.find({
      place_id: place_id,
      date: date,
    });

    for (const reservation of booked_reservations) {
      if (
        end_time <= reservation.start_time ||
        reservation.end_time <= start_time
      ) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  async save(dto: CreateReservePlaceDto) {
    const existPlace = await this.placeService.findOne(dto.place_id);
    const startTime =
      Number(dto.start_time.split(':')[0]) * 60 +
      Number(dto.start_time.split(':')[1]);
    const endTime =
      Number(dto.end_time.split(':')[0]) * 60 +
      Number(dto.end_time.split(':')[1]);
    const timeDiff =
      startTime < endTime ? endTime - startTime : 24 * 60 - startTime + endTime;
    const isPossible = await this.checkPossible(
      dto.place_id,
      dto.date,
      dto.start_time,
      dto.end_time,
    );

    if (!isPossible) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    if (
      (existPlace.region == PlaceRegion.community_center &&
        timeDiff <= existPlace.max_minutes) ||
      !existPlace.max_minutes
    ) {
      Object.assign(dto, { status: ReservationStatus.accept });
    } else if (existPlace.max_minutes && timeDiff > existPlace.max_minutes) {
      throw new BadRequestException(Message.BAD_RESERVATION_TIME);
    }

    if (
      dto.title === '' ||
      dto.phone === '' ||
      dto.booker_id === '' ||
      dto.description === ''
    ) {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }

    return this.reservePlaceRepo.save(dto);
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

  async findAllByPlaceName(placeName: string) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return this.reservePlaceRepo.find({ place_id: existPlace.uuid });
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
