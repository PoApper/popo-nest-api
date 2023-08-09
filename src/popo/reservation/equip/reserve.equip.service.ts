import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Like, MoreThan, Repository } from 'typeorm'
import { ReserveEquip } from './reserve.equip.entity';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { UserService } from '../../user/user.service';
import { EquipService } from '../../equip/equip.service';
import { ReservationStatus } from '../reservation.meta';
import { calculateReservationDurationMinutes } from '../../../utils/reservation-utils';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
  NOT_ENOUGH_INFORMATION: "There's no enough information about reservation",
  DUPLICATED_RESERVATION_EXIST:
    'Your reservation is already exist on that day: accepted or in-progress.',
  OVER_MAX_RESERVATION_TIME:
    'Over the allocated reservation minutes of that day.',
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
      where: {
        date: date,
        status: ReservationStatus.accept,
        start_time: LessThan(end_time),
        end_time: MoreThan(start_time),
      }
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

  async save(dto: CreateReserveEquipDto, booker_id: string) {
    const { equipments, date, start_time, end_time, owner } = dto;

    if (
      !dto.equipments.length ||
      dto.phone === '' ||
      dto.title === '' ||
      dto.description === ''
    ) {
      throw new BadRequestException(Message.NOT_ENOUGH_INFORMATION);
    }
    const targetEquipments = await this.equipService.findByIds(dto.equipments);
    if (!targetEquipments) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    // Reservation Overlap Check
    const isReservationOverlap = await this.isReservationOverlap(
      equipments,
      date,
      start_time,
      end_time,
    );
    if (isReservationOverlap) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    // Reservation Duration Check
    const reservationsOfDay = await this.reserveEquipRepo.find({
      where: {
        booker_id: booker_id,
        date: date,
        owner: owner,
        status: In([ReservationStatus.accept, ReservationStatus.in_process]),
      },
    });

    const newReservationMinutes = calculateReservationDurationMinutes(
      dto.start_time,
      dto.end_time,
    );

    for (const targetEquipment of targetEquipments) {
      if (
        targetEquipment.max_minutes &&
        newReservationMinutes > targetEquipment.max_minutes
      ) {
        throw new BadRequestException(
          `${Message.OVER_MAX_RESERVATION_TIME}: ${targetEquipment.name} max ${targetEquipment.max_minutes} mins, new ${newReservationMinutes} mins`,
        );
      }

      let totalReservationMinutes = 0;
      for (const reservation of reservationsOfDay) {
        if (!reservation.equipments.includes(targetEquipment.uuid)) continue;
        const reservationDuration = calculateReservationDurationMinutes(
          reservation.start_time,
          reservation.end_time,
        );
        totalReservationMinutes += reservationDuration;
      }
      if (
        totalReservationMinutes + newReservationMinutes >
        targetEquipment.max_minutes
      ) {
        throw new BadRequestException(
          `${Message.OVER_MAX_RESERVATION_TIME}: ${targetEquipment.name} max ${targetEquipment.max_minutes} mins, today ${totalReservationMinutes} mins, new ${newReservationMinutes} mins`,
        );
      }
    }

    return this.reserveEquipRepo.save(dto);
  }

  countEquipmentReservations(equipment_id: string) {
    return this.reserveEquipRepo.count({
      where: { equipments: Like(`%${equipment_id}%`) },
    });
  }

  find(findOptions?: object) {
    return this.reserveEquipRepo.find(findOptions);
  }

  findOneByUuid(uuid: string) {
    return this.reserveEquipRepo.findOneBy({ uuid: uuid});
  }

  findOneByUuidOrFail(uuid: string) {
    return this.reserveEquipRepo.findOneByOrFail({ uuid: uuid});
  }

  remove(uuid: string) {
    return this.reserveEquipRepo.delete(uuid);
  }

  async updateStatus(uuid: string, status: ReservationStatus) {
    const existReserve = await this.findOneByUuidOrFail(uuid);

    await this.reserveEquipRepo.update(
      { uuid: uuid },
      {
        status: status,
      },
    );

    const existUser = await this.userService.findOneByUuid(existReserve.booker_id);

    return {
      userType: existUser.userType,
      email: existUser.email,
      title: existReserve.title,
    };
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

  async joinEquips(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const equipments_list = [];
      for (const equip_uuid of reservation.equipments) {
        const equipment = await this.equipService.findOneByUuid(equip_uuid);
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
