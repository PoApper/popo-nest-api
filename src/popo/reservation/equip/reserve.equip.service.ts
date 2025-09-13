import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Like, MoreThan, Repository } from 'typeorm';
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
    uuidList: string[],
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const booked_reservations = await this.find({
      where: {
        date: date,
        status: ReservationStatus.accept,
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
    });

    for (const reservation of booked_reservations) {
      if (reservation.equipments.some((equip) => uuidList.includes(equip))) {
        const isOverlap =
          reservation.startTime < endTime && startTime < reservation.endTime;

        if (isOverlap) {
          return true;
        }
      }
    }
    return false;
  }

  async save(dto: CreateReserveEquipDto) {
    const { equipments, date, startTime, endTime, owner } = dto;

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
      startTime,
      endTime,
    );
    if (isReservationOverlap) {
      throw new BadRequestException(Message.OVERLAP_RESERVATION);
    }

    // Reservation Duration Check
    const reservationsOfDay = await this.reserveEquipRepo.find({
      where: {
        bookerId: dto.bookerId,
        date: date,
        owner: owner,
        status: In([ReservationStatus.accept, ReservationStatus.in_process]),
      },
    });

    const newReservationMinutes = calculateReservationDurationMinutes(
      dto.startTime,
      dto.endTime,
    );

    for (const targetEquipment of targetEquipments) {
      if (
        targetEquipment.maxMinutes &&
        newReservationMinutes > targetEquipment.maxMinutes
      ) {
        throw new BadRequestException(
          `${Message.OVER_MAX_RESERVATION_TIME}: ${targetEquipment.name} max ${targetEquipment.maxMinutes} mins, new ${newReservationMinutes} mins`,
        );
      }

      let totalReservationMinutes = 0;
      for (const reservation of reservationsOfDay) {
        if (!reservation.equipments.includes(targetEquipment.uuid)) continue;
        const reservationDuration = calculateReservationDurationMinutes(
          reservation.startTime,
          reservation.endTime,
        );
        totalReservationMinutes += reservationDuration;
      }
      if (
        totalReservationMinutes + newReservationMinutes >
        targetEquipment.maxMinutes
      ) {
        throw new BadRequestException(
          `${Message.OVER_MAX_RESERVATION_TIME}: ${targetEquipment.name} max ${targetEquipment.maxMinutes} mins, today ${totalReservationMinutes} mins, new ${newReservationMinutes} mins`,
        );
      }
    }

    return this.reserveEquipRepo.save(dto);
  }

  countEquipmentReservations(equipmentId: string) {
    return this.reserveEquipRepo.count({
      where: { equipments: Like(`%${equipmentId}%`) },
    });
  }

  find(findOptions?: object) {
    return this.reserveEquipRepo.find(findOptions);
  }

  count(whereOption?: object) {
    return this.reserveEquipRepo.count({ where: whereOption });
  }

  findOneByUuid(uuid: string) {
    return this.reserveEquipRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.reserveEquipRepo.findOneByOrFail({ uuid: uuid });
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

    const existUser = await this.userService.findOneByUuid(
      existReserve.bookerId,
    );

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
        reservation.bookerId,
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
      const equipmentsList = [];
      for (const equipUuid of reservation.equipments) {
        const equipment = await this.equipService.findOneByUuid(equipUuid);
        if (equipment) {
          equipmentsList.push(equipment);
        }
      }
      reservation.equipments = equipmentsList;
      refinedReservations.push(reservation);
    }
    return refinedReservations;
  }
}
