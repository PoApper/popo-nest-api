import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async findAll(category?: string): Promise<Activity[]> {
    if (category) {
      return this.activityRepository.find({
        where: { category },
        order: { createdAt: 'DESC' },
      });
    }
    return this.activityRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(uuid: string): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { uuid } });
  }

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create(dto);
    return this.activityRepository.save(activity);
  }

  async update(uuid: string, dto: UpdateActivityDto): Promise<Activity | null> {
    await this.activityRepository.update({ uuid }, dto);
    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<void> {
    await this.activityRepository.delete({ uuid });
  }
}
