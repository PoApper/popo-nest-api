import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {UserService} from "../user/user.service";
import {Equip} from "./equip.entity";
import {CreateEquipDto} from './equip.dto';
import {UserType} from "../user/user.meta";
import fs from "fs";
import {EquipOwner} from "./equip.meta";

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_EQUIP: "There's no such equip.",
  INVALID_OWNER: "Only Association can have a equip.",
  INVALID_STAFF: "Only Staff and ADMIN can be a manager."
}

@Injectable()
export class EquipService {
  constructor(
    @InjectRepository(Equip)
    private readonly equipRepo: Repository<Equip>,
    private readonly userService: UserService,
  ) {
  }


  async save(dto: CreateEquipDto, fileName: string) {
    if (dto.equipStaff) {
      const existStaff = await this.userService.findOne({uuid: dto.equipStaff});
      if (!existStaff) {
        throw new BadRequestException(Message.NOT_EXISTING_USER);
      }
      if (existStaff.userType != UserType.staff && existStaff.userType != UserType.admin) {
        throw new BadRequestException(Message.INVALID_STAFF);
      }
    }

    return this.equipRepo.save({
      name: dto.name,
      description: dto.description,
      fee: dto.fee,
      equipOwner: dto.equipOwner,
      equipStaff: dto.equipStaff,
      imageName: fileName,
    })
  }

  find(findOptions?: object) {
    return this.equipRepo.find(findOptions);
  }

  findOne(findOptions: object, maybeOptions?: object) {
    return this.equipRepo.findOne(findOptions, maybeOptions);
  }

  async findOneByName(name: string) {
    const existEquip = await this.equipRepo.findOne({name: name});

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return existEquip;
  }

  async findAllByOwner(owner: EquipOwner) {
    return this.equipRepo.find({
      where: {equipOwner: owner},
      order: {updatedAt: "DESC"}
    });
  }

  async update(uuid: string, dto: CreateEquipDto, imageName: string) {
    const existEquip = await this.findOne({uuid: uuid});

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    if (existEquip.equipStaff != dto.equipStaff) {
      const existStaff = await this.userService.findOne({uuid: dto.equipStaff});
      if (!existStaff) {
        throw new BadRequestException(Message.NOT_EXISTING_USER);
      }
    }

    // delete previous image
    if (imageName && existEquip.imageName) {
      fs.unlinkSync('./uploads/equip/' + existEquip.imageName);
    }

    return this.equipRepo.update({uuid: uuid}, {
      name: dto.name,
      description: dto.description,
      fee: dto.fee,
      equipOwner: dto.equipOwner,
      equipStaff: dto.equipStaff,
      imageName: (imageName) ? imageName : existEquip.imageName,
    })
  }

  async delete(uuid: string) {
    const existEquip = await this.findOne({uuid: uuid});

    if (!existEquip) {
      throw new BadRequestException(Message.NOT_EXISTING_EQUIP);
    }

    return this.equipRepo.delete(uuid);
  }
}
