import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs";
import { Place } from "./place.entity";
import { CreatePlaceDto } from "./place.dto";
import { UserService } from "../user/user.service";
import { UserType } from "../user/user.meta";
import { PlaceRegion } from "./place.meta";

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such place.",
  INVALID_OWNER: "Only Association can have a place.",
  INVALID_STAFF: "Only Staff and ADMIN can be a manager."
};

@Injectable()
export class PlaceService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
    private readonly userService: UserService
  ) {
  }

  async save(dto: CreatePlaceDto, fileName: string) {
    const existOwner = await this.userService.findOne({ uuid: dto.placeOwner });
    // Owner가 학생단체여야 함.
    if (!existOwner) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }
    if (existOwner.userType != UserType.association) {
      throw new BadRequestException(Message.INVALID_OWNER);
    }

    let existStaff;
    if (dto.placeStaffUUID) {
      existStaff = await this.userService.findOne({ uuid: dto.placeStaffUUID });
      if (!existStaff) {
        throw new BadRequestException(Message.NOT_EXISTING_USER);
      }
      if (existStaff.userType != UserType.staff && existStaff.userType != UserType.admin) {
        throw new BadRequestException(Message.INVALID_STAFF);
      }
    }

    return this.placeRepo.save({
      name: dto.name,
      location: dto.location,
      description: dto.description,
      region: dto.region,
      placeOwner: dto.placeOwner,
      placeStaff: existStaff,
      imageName: fileName
    });
  }

  async find() {
    return this.placeRepo.find({ relations: ["placeStaff"], order: { updateAt: "DESC" } });
  }

  count(findOptions: object) {
    return this.placeRepo.count(findOptions);
  }

  async findOne(uuid: string, findOptions?: any) {
    const existPlace = await this.placeRepo.findOne({ uuid: uuid }, findOptions);

    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const existOwner = await this.userService.findOne({ uuid: existPlace.placeOwner });

    if (!existOwner) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }
    return existPlace;
  }

  async findOneByName(name: string) {
    const existPlace = await this.placeRepo.findOne({ name: name });

    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const existOwner = await this.userService.findOne({ uuid: existPlace.placeOwner });

    if (!existOwner) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return existPlace;
  }

  async findAllByRegion(region: PlaceRegion) {
    return this.placeRepo.find({
      where: { region: region },
      order: { updateAt: "DESC" }
    });
  }

  async findAllByOwner(owner_uuid: string) {
    const existUser = await this.userService.findOne({ uuid: owner_uuid });

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.placeRepo.find({
      where: { placeOwner: owner_uuid },
      order: { updateAt: "DESC" }
    });
  }

  async update(uuid: string, dto: CreatePlaceDto, imageName: string) {
    const existPlace = await this.findOne(uuid, { relations: ["placeStaff"] });
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    console.log(dto);

    const partialEntity = {
      uuid: uuid,
      name: dto.name,
      location: dto.location,
      description: dto.description,
      region: dto.region
    };

    if (dto.placeOwner) {
      const existOwner = await this.userService.findOne({ uuid: dto.placeOwner });
      if (!existOwner) {
        throw new BadRequestException(Message.NOT_EXISTING_USER);
      }
      partialEntity["placeOwner"] = dto.placeOwner;
    }
    console.log("3");

    if (dto.placeStaffUUID) {
      const existStaff = await this.userService.findOne({ uuid: dto.placeStaffUUID });

      if (!existStaff) {
        throw new BadRequestException(Message.NOT_EXISTING_USER);
      }
      if (existStaff.userType != UserType.staff && existStaff.userType != UserType.admin) {
        throw new BadRequestException(Message.INVALID_STAFF);
      }
      partialEntity["placeStaff"] = existStaff;
    } else {
      partialEntity["placeStaff"] = null;
    }

    // delete previous image
    if (imageName) {
      if (fs.existsSync(`./uploads/place/${existPlace.imageName}`)) {
        fs.unlinkSync(`./uploads/place/${existPlace.imageName}`);
      }
      partialEntity["imageName"] = imageName;
    }

    return this.placeRepo.update({ uuid: uuid }, partialEntity);
  }

  async remove(uuid: string) {
    const existPlace = await this.findOne(uuid);

    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.placeRepo.delete({uuid: uuid});
  }
}
