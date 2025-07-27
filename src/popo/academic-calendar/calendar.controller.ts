import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { CalendarService } from './calendar.service';
import { CalendarDto } from './calendar.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import * as moment from 'moment';
import { Public } from '../../common/public-guard.decorator';

@ApiTags('Academic Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @ApiBody({ type: CalendarDto })
  createCalendar(@Body() dto: CalendarDto) {
    return this.calendarService.save(dto);
  }

  @Public()
  @Get()
  getAllCalendars() {
    return this.calendarService.findAll();
  }

  @Public()
  @Get('get-next-event')
  async getNextEvent() {
    const today = moment().format('YYYY-MM-DD');
    const events = await this.calendarService.findEventAfter(today);
    return events[0];
  }

  @Public()
  @Get(':id')
  getCalendarByUuid(@Param('id') id: number) {
    return this.calendarService.findById(id);
  }

  @ApiCookieAuth()
  @Put(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @ApiBody({ type: CalendarDto })
  updateCalendar(@Param('id') id: number, @Body() dto: CalendarDto) {
    return this.calendarService.update(id, dto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  deleteCalendar(@Param('id') id: number) {
    return this.calendarService.delete(id);
  }
}
