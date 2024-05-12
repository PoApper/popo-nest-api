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
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: number) {
    return this.calendarRepo.findOneBy({ id: id });
  }

  findEventAfter(after_date: string) {
    return this.calendarRepo.find({
      where: {
        start_date: MoreThanOrEqual(after_date),
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
