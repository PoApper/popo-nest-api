import { Controller, Get, Query } from '@nestjs/common';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ReserveEquipService } from 'src/popo/reservation/equip/reserve.equip.service';
import { Public } from '../common/public-guard.decorator';

@ApiTags('Statistics - Reservation Equipment')
@Controller('statistics/reservation/equipment')
export class ReservationEquipmentStatisticsController {
  constructor(private readonly reserveEquipService: ReserveEquipService) {}

  @Public()
  @ApiOperation({
    summary: '기간 별 장비예약 통계',
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
  async getEquipReservationCounts(@Query() query) {
    const query_start = moment(query.start);
    const query_end = moment(query.end);

    const data = {};
    const query_idx = query_start;

    while (query_idx.isBefore(query_end)) {
      const target_month = query_idx.format('YYYY-MM');
      const target_start_date = query_idx.format('YYYY-MM-DD');
      const target_end_date = query_idx.add(1, 'M').format('YYYY-MM-DD');

      data[target_month] = await this.reserveEquipService.count({
        created_at: Between(target_start_date, target_end_date),
      });
    }

    return {
      label: 'equipment',
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

    const totalReservationCnt = await this.reserveEquipService.count();

    const todayReservationCnt = await this.reserveEquipService.count({
      created_at: Between(
        moment().startOf('day').toDate(),
        moment().endOf('day').toDate(),
      ),
    });

    const thisWeekReservationCnt = await this.reserveEquipService.count({
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
