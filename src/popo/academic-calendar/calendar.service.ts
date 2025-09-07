import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { Calendar } from './calendar.entity';
import { CalendarDto } from './calendar.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepo: Repository<Calendar>,
  ) {}

  save(dto: CalendarDto) {
    return this.calendarRepo.save(dto);
  }

  findAll() {
    return this.calendarRepo.find({
      order: { eventDate: 'DESC' },
    });
  }

  findById(id: number) {
    return this.calendarRepo.findOneBy({ id: id });
  }

  findEventAfter(afterDate: string) {
    return this.calendarRepo.find({
      where: {
        eventDate: MoreThanOrEqual(afterDate),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  update(id: number, dto: CalendarDto) {
    return this.calendarRepo.update({ id: id }, dto);
  }

  delete(id: number) {
    return this.calendarRepo.delete({ id: id });
  }
}
