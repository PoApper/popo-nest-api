import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservePlace } from './reserve.place.entity';
import { Repository } from 'typeorm';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { PlaceService } from '../../place/place.service';
import { ReservationStatus } from '../reservation.meta';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such place.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
};

@Injectable()
export class ReservePlaceService {
  constructor(
    @InjectRepository(ReservePlace)
    private readonly reservePlaceRepo: Repository<ReservePlace>,
    private readonly userService: UserService,
    private readonly placeService: PlaceService,
  ) {}

  async save(dto: CreateReservePlaceDto) {
    const existPlace = await this.placeService.findOne(dto.place);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const existUser = await this.userService.findOne({ uuid: dto.user });
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.reservePlaceRepo.save(dto);
  }

  async saveWithNameAndId(dto: CreateReservePlaceDto) {
    const existPlace = await this.placeService.findOne(dto.place);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const existUser = await this.userService.findOne({ uuid: dto.user });
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    const bookedReservations = await this.findAllByPlaceNameAndDate(
      existPlace.name,
      dto.date,
    );

    for (const reservation of bookedReservations) {
      if (
        dto.endTime <= reservation.startTime ||
        reservation.endTime <= dto.startTime
      ) {
        continue;
      } else {
        throw new BadRequestException(Message.OVERLAP_RESERVATION);
      }
    }

    return this.reservePlaceRepo.save({
      place: existPlace.uuid,
      user: existUser.uuid,
      phone: dto.phone,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reserveStatus: ReservationStatus.in_process,
    });
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
    return this.reservePlaceRepo.find({ place: existPlace.uuid });
  }

  async findAllByPlaceNameAndDate(placeName: string, date: number) {
    const existPlace = await this.placeService.findOneByName(placeName);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return this.reservePlaceRepo.find({ place: existPlace.uuid, date: date });
  }

  async updateStatus(uuid: string, reserveStatus: ReservationStatus) {
    const existReserve = await this.findOne(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION);
    }

    this.reservePlaceRepo.update(
      { uuid: uuid },
      {
        reserveStatus: reserveStatus,
      },
    );

    const existUser = await this.userService.findOne({
      uuid: existReserve.user,
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
}
