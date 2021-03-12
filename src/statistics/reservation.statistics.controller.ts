import {Controller, Get, Query} from "@nestjs/common";
import {Between} from "typeorm";
import * as moment from 'moment';
import {ReservePlaceService} from "../popo/reservation/place/reserve.place.service";

@Controller('statistics/reservation')
export class ReservationStatisticsController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService
  ) {
  }

  // Place Reservation에 대한 통계 기능만 구현함.
  /**
   * format: GET statistics/place?start=YYYYMMDD&end=YYYYMMDD&format={YYYY | YYYYMM | YYYYMMDD}
   */
  @Get()
  async getPlaceCounts(@Query() query) {
    const query_idx = moment(query.start);
    const query_end = moment(query.end);
    const data = {};
    while (query_idx.isBefore(query_end)) {
      data[query_idx.format('YYYY-MM')] = await this.reservePlaceService.count({
        createdAt: Between(query_idx.format(), query_idx.add(1, 'M').format())
      })
    }

    return {
      "label": "place",
      "data": data
    }
  }

}