import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {ReserveEquip} from "./reserve.equip.entity";
import {Repository} from "typeorm";
import {CreateReserveEquipDto} from "./reserve.equip.dto";
import {UserService} from "../../user/user.service";
import {EquipService} from "../../equip/equip.service";
import {ReservationStatus} from "../reservation.meta";

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: "Reservation time overlapped."
}

@Injectable()
export class ReserveEquipService {
  constructor(
    @InjectRepository(ReserveEquip)
    private readonly reserveEquipRepo: Repository<ReserveEquip>,
    private readonly userService: UserService,
    private readonly equipService: EquipService
  ) {
  }

  async save(dto: CreateReserveEquipDto) {
    const existEquip = await this.equipService.findOne({uuid: dto.equip});
    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    const existUser = await this.userService.findOne({uuid: dto.user});
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.reserveEquipRepo.save({
      equip: dto.equip,
      user: dto.user,
      phone: dto.phone,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reserveStatus: ReservationStatus.in_process,
    });
  }

  async saveWithNameAndId(dto: CreateReserveEquipDto) {
    const existEquip = await this.equipService.findOneByName(dto.equip);
    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    const existUser = await this.userService.findOneById(dto.user);
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    const bookedReservations = await this.findAllByEquipNameAndDate(existEquip.name, dto.date);

    for (const reservation of bookedReservations) {
      if (dto.endTime <= reservation.startTime || reservation.endTime <= dto.startTime) {
        continue;
      } else {
        throw new BadRequestException(Message.OVERLAP_RESERVATION);
      }
    }

    return this.reserveEquipRepo.save({
      equip: existEquip.uuid,
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

  findAll() {
    return this.reserveEquipRepo.find({order: {createdAt: "DESC"}});
  }

  findOne(uuid: string) {
    return this.reserveEquipRepo.findOne(uuid);
  }

  findAllByEquip(equip_uuid: string) {
    return this.reserveEquipRepo.find({where: {equip: equip_uuid}, order: {createdAt: "DESC"}});
  }

  async findAllByEquipName(equipName: string) {
    const existEquip = await this.equipService.findOneByName(equipName);
    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }
    return this.reserveEquipRepo.find({equip: existEquip.uuid});
  }

  async findAllByEquipNameAndDate(equipName: string, date: number) {
    const existEquip = await this.equipService.findOneByName(equipName);
    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }
    return this.reserveEquipRepo.find({equip: existEquip.uuid, date: date});
  }


  findAllByStatus(reserve_status: ReservationStatus) {
    return this.reserveEquipRepo.find({reserveStatus: reserve_status});
  }

  findAllByDate(date: number) {
    return this.reserveEquipRepo.find({date: date});
  }

  async updateStatus(uuid: string, reserveStatus: ReservationStatus) {
    const existReserve = await this.findOne(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION)
    }

    this.reserveEquipRepo.update(uuid, {
      reserveStatus: reserveStatus
    })

    const existUser = await this.userService.findOne({uuid: existReserve.user});

    return {
      'userType': existUser.userType,
      'email': existUser.email,
      'title': existReserve.title
    }
  }

  remove(uuid: string) {
    return this.reserveEquipRepo.delete(uuid);
  }
}