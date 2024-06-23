import { Controller, Get, Query } from '@nestjs/common';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { UserService } from '../popo/user/user.service';

@ApiTags('Statistics')
@Controller('statistics/user')
export class UserStatisticsController {
  constructor(private readonly userService: UserService) {}

  /**
   * format: GET statistics/user?start=YYYYMMDD&end=YYYYMMDD&format={YYYY | YYYYMM | YYYYMMDD}
   */
  @Get()
  @ApiQuery({
    name: 'start',
  })
  @ApiQuery({
    name: 'end',
  })
  @ApiQuery({
    name: 'format',
  })
  async getUserRegisterStatistics(@Query() query) {
    const query_start = moment(query.start);
    const query_end = moment(query.end);

    const data = {};
    const query_idx = query_start;

    while (query_idx.isBefore(query_end)) {
      const target_month = query_idx.format('YYYY-MM');
      const target_start_date = query_idx.format('YYYY-MM-DD');
      const target_end_date = query_idx.add(1, 'M').format('YYYY-MM-DD');

      console.log(target_month, target_start_date, target_end_date);

      data[target_month] = await this.userService.count({
        createdAt: Between(target_start_date, target_end_date),
      });
    }

    return {
      label: 'user',
      data: data,
    };
  }

  // 전체 유저 수, 오늘 가입 유저 수, 이번주 가입 유저 수, 오늘 로그인 유저 수, 이번주 로그인 유저 수
  @Get('count')
  async countInfo() {
    moment.updateLocale('en', {
      week: {
        dow: 1, // Monday is the first day of the week.
      },
    });

    const totalUserCnt = await this.userService.count();

    const todayRegisterUserCnt = await this.userService.count({
      createdAt: Between(
        moment().startOf('day').toDate(),
        moment().endOf('day').toDate(),
      ),
    });
    const todayLoginUserCnt = await this.userService.count({
      lastLoginAt: Between(
        moment().startOf('day').toDate(),
        moment().endOf('day').toDate(),
      ),
    });

    const thisWeekRegisterUserCnt = await this.userService.count({
      createdAt: Between(
        moment().startOf('week').toDate(),
        moment().endOf('week').toDate(),
      ),
    });
    const thisWeekLoginUserCnt = await this.userService.count({
      lastLoginAt: Between(
        moment().startOf('week').toDate(),
        moment().endOf('week').toDate(),
      ),
    });

    return {
      totalUserCnt,
      todayRegisterUserCnt,
      todayLoginUserCnt,
      thisWeekRegisterUserCnt,
      thisWeekLoginUserCnt,
    };
  }
}
