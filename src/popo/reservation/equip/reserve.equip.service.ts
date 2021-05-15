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
    const existEquips = await this.equipService.findByIds(dto.equips);
    if (!existEquips) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    const existUser = await this.userService.findOne({id: dto.user});
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.reserveEquipRepo.save({
      equips: dto.equips,
      user: existUser.uuid,
      owner: dto.owner,
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
    return this.reserveEquipRepo.find(findOptions);
  }

  findOne(uuid: string, findOptions?: any) {
    return this.reserveEquipRepo.findOne({uuid: uuid}, findOptions);
  }

  remove(uuid: string) {
    return this.reserveEquipRepo.delete(uuid);
  }

  async updateStatus(uuid: string, reserveStatus: ReservationStatus) {
    const existReserve = await this.findOne(uuid);

    if (!existReserve) {
      throw new BadRequestException(Message.NOT_EXISTING_RESERVATION);
    }

    this.reserveEquipRepo.update({ uuid: uuid }, {
      reserveStatus: reserveStatus
    });

    const existUser = await this.userService.findOne({ uuid: existReserve.user });

    return {
      "userType": existUser.userType,
      "email": existUser.email,
      "title": existReserve.title
    };
  }

}