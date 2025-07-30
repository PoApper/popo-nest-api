import { Controller, Get, Query } from '@nestjs/common';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { Public } from '../common/public-guard.decorator';

@ApiTags('Statistics - Reservation Place')
@Controller('statistics/reservation/place')
export class ReservationPlaceStatisticsController {
  constructor(private readonly reservePlaceService: ReservePlaceService) {}

  @Public()
  @ApiOperation({
    summary: '기간 별 장소예약 통계',
  })
  @ApiQuery({
    name: 'start',
    required: true,
    type: String,
    example: '20200101',
  })
  @ApiQuery({
    name: 'end',
    required: true,
    type: String,
    example: '20250101',
  })
  @Get()
  async getPlaceReservationCounts(@Query() query) {
    const query_start = moment(query.start);
    const query_end = moment(query.end);

    const data = {};
    const query_idx = query_start;

    while (query_idx.isBefore(query_end)) {
      const target_month = query_idx.format('YYYY-MM');
      const target_start_date = query_idx.format('YYYY-MM-DD');
      const target_end_date = query_idx.add(1, 'M').format('YYYY-MM-DD');

      data[target_month] = await this.reservePlaceService.count({
        created_at: Between(target_start_date, target_end_date),
      });
    }

    return {
      label: 'place',
      data: data,
    };
  }

  @Public()
  @ApiOperation({
    summary: '전체 예약 수, 오늘 예약 수, 이번주 예약 수',
  })
  @Get('count')
  async countInfo() {
    moment.updateLocale('en', {
      week: {
        dow: 1, // Monday is the first day of the week.
      },
    });

    const totalReservationCnt = await this.reservePlaceService.count();

    const todayReservationCnt = await this.reservePlaceService.count({
      created_at: Between(
        moment().startOf('day').toDate(),
        moment().endOf('day').toDate(),
      ),
    });

    const thisWeekReservationCnt = await this.reservePlaceService.count({
      created_at: Between(
        moment().startOf('week').toDate(),
        moment().endOf('week').toDate(),
      ),
    });

    return {
      totalReservationCnt,
      todayReservationCnt,
      thisWeekReservationCnt,
    };
  }
}
