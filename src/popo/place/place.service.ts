import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { PlaceDto } from './place.dto';
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
  ) {}

  save(dto: PlaceDto) {
    const saveDto = {
      name: dto.name,
      location: dto.location,
      description: dto.description,
      region: dto.region,
      staffEmail: dto.staffEmail,
      maxMinutes: dto.maxMinutes,
      maxConcurrentReservation: dto.maxConcurrentReservation,
      openingHours: dto.openingHours,
      enableAutoAccept: dto.enableAutoAccept,
    };
    return this.placeRepo.save(saveDto);
  }

  updateImageUrl(uuid: string, imageUrl: string) {
    return this.placeRepo.update({ uuid: uuid }, { imageUrl: imageUrl });
  }

  find() {
    return this.placeRepo.find({ order: { updatedAt: 'DESC' } });
  }

  findOneByUuid(uuid: string) {
    return this.placeRepo.findOneBy({ uuid: uuid });
  }

  findOneByUuidOrFail(uuid: string) {
    const place = this.findOneByUuid(uuid);
    if (!place) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }
    return place;
  }

  findOneByName(name: string) {
    return this.placeRepo.findOneBy({ name: name });
  }

  async findAllByRegion(region: PlaceRegion) {
    return this.placeRepo.find({
      where: { region: region },
      order: { updatedAt: 'DESC' },
    });
  }

  async update(uuid: string, dto: PlaceDto) {
    const existPlace = await this.findOneByUuid(uuid);
    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.placeRepo.update({ uuid: uuid }, dto);
  }

  // delta: +1 or -1
  async updateReservationCountByDelta(uuid: string, delta: number) {
    const place = await this.placeRepo.findOneByOrFail({ uuid: uuid });
    return this.placeRepo.update(
      { uuid: uuid },
      { totalReservationCount: place.totalReservationCount + delta },
    );
  }

  updateReservationCount(uuid: string, reservation_count: number) {
    return this.placeRepo.update(
      { uuid: uuid },
      { totalReservationCount: reservation_count },
    );
  }

  async remove(uuid: string) {
    const existPlace = await this.findOneByUuid(uuid);

    if (!existPlace) {
      throw new BadRequestException(Message.NOT_EXISTING_PLACE);
    }

    return this.placeRepo.delete({ uuid: uuid });
  }
}
