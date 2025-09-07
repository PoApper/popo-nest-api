import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

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
      equipOwner: dto.equipOwner,
      staffEmail: dto.staffEmail,
      maxMinutes: dto.maxMinutes,
    });
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.equipRepo.update({ uuid: uuid }, { imageUrl: imageUrl });
  }

  find(findOptions?: object) {
    return this.equipRepo.find(findOptions);
  }

  findByIds(ids: string[]) {
    return this.equipRepo.findBy({ uuid: In(ids) });
  }

  findOneByUuid(uuid: string) {
    return this.equipRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    return this.equipRepo.findOneByOrFail({ uuid: uuid });
  }

  async findOneByName(name: string) {
    const existEquip = await this.equipRepo.findOneBy({ name: name });

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return existEquip;
  }

  async findAllByOwner(owner: EquipOwner) {
    return this.equipRepo.find({
      where: { equipOwner: owner },
      order: { updatedAt: 'DESC' },
    });
  }

  async update(uuid: string, dto: EquipmentDto) {
    await this.findOneByUuidOrFail(uuid);
    return this.equipRepo.update({ uuid: uuid }, dto);
  }

  async updateReservationCountByDelta(uuid: string, delta: number) {
    const equipment = await this.findOneByUuidOrFail(uuid);
    return this.equipRepo.update(
      { uuid: uuid },
      { totalReservationCount: equipment.totalReservationCount + delta },
    );
  }

  updateReservationCount(uuid: string, reservationCount: number) {
    return this.equipRepo.update(
      { uuid: uuid },
      { totalReservationCount: reservationCount },
    );
  }

  async delete(uuid: string) {
    await this.findOneByUuidOrFail(uuid);
    return this.equipRepo.delete(uuid);
  }
}
