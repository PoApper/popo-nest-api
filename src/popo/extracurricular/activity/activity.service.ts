import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';
import { ActivityReportService } from '../report/activity-report.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly activityReportService: ActivityReportService,
  ) {}

  async findAll(category?: string): Promise<Activity[]> {
    if (category) {
      return this.activityRepo.find({
        where: { category },
        order: { createdAt: 'DESC' },
      });
    }
    return this.activityRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(uuid: string): Promise<Activity | null> {
    return this.activityRepo.findOne({ where: { uuid } });
  }

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create(dto);
    return this.activityRepo.save(activity);
  }

  async update(uuid: string, dto: UpdateActivityDto): Promise<Activity | null> {
    await this.activityRepo.update({ uuid }, dto);
    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<void> {
    await this.activityReportService.removeForActivity(uuid);
  }
}
