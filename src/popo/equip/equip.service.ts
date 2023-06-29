import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equip } from './equip.entity';
import { EquipmentDto } from './equip.dto';
import { EquipOwner } from './equip.meta';

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  INVALID_OWNER: 'Only Association can have a equip.',
  INVALID_STAFF: 'Only Staff and ADMIN can be a manager.',
};

@Injectable()
export class EquipService {
  constructor(
    @InjectRepository(Equip)
    private readonly equipRepo: Repository<Equip>,
  ) {}

  async save(dto: EquipmentDto) {
    return this.equipRepo.save({
      name: dto.name,
      description: dto.description,
      fee: dto.fee,
      equip_owner: dto.equip_owner,
      staff_email: dto.staff_email,
      max_minutes: dto.max_minutes,
    });
  }

  updateImageUrl(uuid: string, image_url: string) {
    return this.equipRepo.update({ uuid: uuid }, { image_url: image_url });
  }

  find(findOptions?: object) {
    return this.equipRepo.find(findOptions);
  }

  findByIds(ids: string[], findOptions?: object) {
    return this.equipRepo.findByIds(ids, findOptions);
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.equipRepo.findOne(findOptions, maybeOptions);
  }

  async findOneOrFail(findOptions: object, maybeOptions?: object) {
    const equip = await this.equipRepo.findOne(findOptions, maybeOptions);
    if (!equip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }
    return equip;
  }

  async findOneByName(name: string) {
    const existEquip = await this.equipRepo.findOne({ name: name });

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return existEquip;
  }

  async findAllByOwner(owner: EquipOwner) {
    return this.equipRepo.find({
      where: { equip_owner: owner },
      order: { updatedAt: 'DESC' },
    });
  }

  async update(uuid: string, dto: EquipmentDto) {
    const existEquip = await this.findOne({ uuid: uuid });
    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return this.equipRepo.update({ uuid: uuid }, dto);
  }

  async updateReservationCountByDelta(uuid: string, delta: number) {
    const place = await this.equipRepo.findOneOrFail(uuid);
    return this.equipRepo.update(
      { uuid: uuid },
      { total_reservation_count: place.total_reservation_count + delta },
    );
  }

  updateReservationCount(uuid: string, reservation_count: number) {
    return this.equipRepo.update(
      { uuid: uuid },
      { total_reservation_count: reservation_count },
    );
  }

  async delete(uuid: string) {
    const existEquip = await this.findOne({ uuid: uuid });

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return this.equipRepo.delete(uuid);
  }
}
