import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveEquip } from './reserve.equip.entity';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { UserService } from '../../user/user.service';
import { EquipService } from '../../equip/equip.service';
import { ReservationStatus } from '../reservation.meta';

const Message = {
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  NOT_EXISTING_RESERVATION: "There's no such reservation.",
  OVERLAP_RESERVATION: 'Reservation time overlapped.',
};

@Injectable()
export class ReserveEquipService {
  constructor(
    @InjectRepository(ReserveEquip)
    private readonly reserveEquipRepo: Repository<ReserveEquip>,
    private readonly userService: UserService,
    private readonly equipService: EquipService,
  ) {}

  async save(dto: CreateReserveEquipDto) {
    const existEquips = await this.equipService.findByIds(dto.equips);
    if (!existEquips) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    const existUser = await this.userService.findOne({ uuid: dto.booker_id });
    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.reserveEquipRepo.save({
      equips: dto.equips,
      booker_id: dto.booker_id,
      owner: dto.owner,
      phone: dto.phone,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      status: ReservationStatus.in_process,
    });
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
}
