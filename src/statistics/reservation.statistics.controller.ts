import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { ApiQuery, ApiTags } from '@nestjs/swagger'

import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';

@ApiTags('Statistics')
@Controller('statistics/reservation')
export class ReservationStatisticsController {
  constructor(private readonly reservePlaceService: ReservePlaceService) {}

  // Place Reservation에 대한 통계 기능만 구현함.
  /**
   * format: GET statistics/place?start=YYYYMMDD&end=YYYYMMDD&format={YYYY | YYYYMM | YYYYMMDD}
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
  async getPlaceCounts(@Query() query) {
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
  
  @Get('count')
  async countInfo() {
    const totalReservationCnt = await this.reservePlaceService.count();
    
    const todayReservationCnt = await this.reservePlaceService.count({
      created_at: Between(moment().startOf('day'), moment().endOf('day'))
    });
    
    const thisWeekReservationCnt = await this.reservePlaceService.count({
      created_at: Between(moment().startOf('week'), moment().endOf('week'))
    });
    
    return {
      totalReservationCnt,
      todayReservationCnt,
      thisWeekReservationCnt,
    }
  }
}
