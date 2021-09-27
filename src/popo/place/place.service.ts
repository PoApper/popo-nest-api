import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Place } from './place.entity';
import { CreatePlaceDto } from './place.dto';
import { UserService } from '../user/user.service';
import { PlaceRegion } from './place.meta';

const Message = {
  NOT_EXISTING_REGION: "There's no such region.",
  NOT_EXISTING_USER: "There's no such user.",
  NOT_EXISTING_PLACE: "There's no such place.",
  INVALID_OWNER: 'Only Association can have a place.',
  INVALID_STAFF: 'Only Staff and ADMIN can be a manager.',
};

@Injectable()
export class PlaceService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,
    private readonly userService: UserService,
  ) {}

  async save(dto: CreatePlaceDto, fileName: string) {
    // let existStaff;
    // if (dto.placeStaffUUID) {
    //   existStaff = await this.userService.findOne({ uuid: dto.placeStaffUUID });
    //   if (!existStaff) {
    //     throw new BadRequestException(Message.NOT_EXISTING_USER);
    //   }
    //   if (existStaff.userType != UserType.staff && existStaff.userType != UserType.admin) {
    //     throw new BadRequestException(Message.INVALID_STAFF);
    //   }
    // }

    return this.placeRepo.save({
      name: dto.name,
      location: dto.location,
      description: dto.description,
      region: dto.region,
      staff_email: dto.staff_email,
      imageName: fileName,
    });
  }

  async find() {
    return this.placeRepo.find({ order: { updateAt: 'DESC' } });
  }

  count(findOptions: object) {
    return this.placeRepo.count(findOptions);
  }

  findOne(uuid: string, findOptions?: any) {
    return this.placeRepo.findOne({ uuid: uuid }, findOptions);
  }

  findOneByName(name: string) {
    return this.placeRepo.findOne({ name: name });
  }

  async findAllByRegion(region: PlaceRegion) {
    return this.placeRepo.find({
      where: { region: region },
      order: { updateAt: 'DESC' },
    });
  }

  async findAllByOwner(owner_uuid: string) {
    const existUser = await this.userService.findOne({ uuid: owner_uuid });

    if (!existUser) {
      throw new BadRequestException(Message.NOT_EXISTING_USER);
    }

    return this.placeRepo.find({
      where: { placeOwner: owner_uuid },
      order: { updateAt: 'DESC' },
    });
  }

  // TODO: refactor code
  async update(uuid: string, dto: CreatePlaceDto, imageName: string) {
    const existPlace = await this.findOne(uuid);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    const partialEntity = {
      uuid: uuid,
      name: dto.name,
      location: dto.location,
      description: dto.description,
      staff_email: dto.staff_email,
      region: dto.region,
    };

    // delete previous image
    if (imageName) {
      if (fs.existsSync(`./uploads/place/${existPlace.imageName}`)) {
        fs.unlinkSync(`./uploads/place/${existPlace.imageName}`);
      }
      partialEntity['imageName'] = imageName;
    }

    return this.placeRepo.update({ uuid: uuid }, partialEntity);
  }

  async remove(uuid: string) {
    const existPlace = await this.findOne(uuid);

    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.placeRepo.delete({ uuid: uuid });
  }
}
