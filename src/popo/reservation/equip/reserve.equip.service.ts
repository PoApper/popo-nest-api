import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveEquip } from './reserve.equip.entity';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { UserService } from '../../user/user.service';
import { EquipService } from '../../equip/equip.service';
import { ReservationStatus } from '../reservation.meta';
import * as moment from 'moment';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
  NOT_ENOUGH_INFORMATION: "There's no enough information about reservation",
  BAD_RESERVATION_TIME: 'Reservation time is not appropriate.',
};

@Injectable()
export class ReserveEquipService {
  constructor(
    @InjectRepository(ReserveEquip)
    private readonly reserveEquipRepo: Repository<ReserveEquip>,
    private readonly userService: UserService,
    private readonly equipService: EquipService,
  ) {}

  async isReservationOverlap(
    uuid_list: string[],
    date: string,
    start_time: string,
    end_time: string,
  ): Promise<boolean> {
    const booked_reservations = await this.find({
      date: date,
      status: ReservationStatus.accept,
    });

    for (const reservation of booked_reservations) {
      if (reservation.equipments.some((equip) => uuid_list.includes(equip))) {
        const isOverlap =
          reservation.start_time < end_time &&
          start_time < reservation.end_time;

        if (isOverlap) {
          return true;
        }
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

  async save(dto: CreateReserveEquipDto) {
    const { equipments, date, start_time, end_time } = dto;

    if (
      !dto.equipments.length ||
      dto.phone === '' ||
      dto.title === '' ||
      dto.description === ''
    ) {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }
    const existEquips = await this.equipService.findByIds(dto.equipments);
    if (!existEquips) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    for (const equip of existEquips) {
      const isOverMaxMinutes = this.isOverMaxMinutes(
        equip.max_minutes,
        start_time,
        end_time,
      );
      if (isOverMaxMinutes) {
        throw new BadRequestException(Message.BAD_RESERVATION_TIME);
      }
    }

    const isReservationOverlap = await this.isReservationOverlap(
      equipments,
      date,
      start_time,
      end_time,
    );
    if (isReservationOverlap) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    return this.reserveEquipRepo.save(dto);
  }

  count() {
    return this.reserveEquipRepo.count();
  }

  find(findOptions?: object) {
    return this.reserveEquipRepo.find(findOptions);
  }

  findOne(uuid: string, findOptions?: any) {
    return this.reserveEquipRepo.findOne({ uuid: uuid }, findOptions);
  }

  remove(uuid: string) {
    return this.reserveEquipRepo.delete(uuid);
  }

  async updateStatus(uuid: string, status: ReservationStatus) {
    const existReserve = await this.findOne(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION);
    }

    this.reserveEquipRepo.update(
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

  async joinBooker(reservations) {
    const refinedReservations = [];

    for (const reservation of reservations) {
      const booker = await this.userService.findOne({
        uuid: reservation.booker_id,
      });
      if (booker) {
        const { password, cryptoSalt, ...booker_info } = booker;
        reservation.booker = booker_info;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }

  async joinEquips(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const equipments_list = [];
      for (const equip_uuid of reservation.equipments) {
        const equipment = await this.equipService.findOne(equip_uuid);
        if (equipment) {
          equipments_list.push(equipment);
        }
      }
      reservation.equipments = equipments_list;
      refinedReservations.push(reservation);
    }
    return refinedReservations;
  }
}
