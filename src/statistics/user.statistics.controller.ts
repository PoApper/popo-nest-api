import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from '../popo/user/user.service';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Statistics')
@Controller('statistics/user')
export class UserStatisticsController {
  constructor(private readonly userService: UserService) {}

  /**
   * format: GET statistics/user?start=YYYYMMDD&end=YYYYMMDD&format={YYYY | YYYYMM | YYYYMMDD}
   */
  @Get()
  async getUserRegisterStatistics(@Query() query) {
    const query_idx = moment(query.start);
    const query_end = moment(query.end);

    const data = {};
    while (query_idx.isBefore(query_end)) {
      data[query_idx.format('YYYY-MM')] = await this.userService.count({
        createdAt: Between(query_idx.format(), query_idx.add(1, 'M').format()),
      });
    }

    return {
      label: 'user',
      data: data,
    };
  }
}
