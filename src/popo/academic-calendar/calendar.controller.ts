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
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { CalendarService } from './calendar.service';
import { CalendarDto } from './calendar.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import * as moment from 'moment';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: CalendarDto })
  createCalendar(@Body() dto: CalendarDto) {
    return this.calendarService.save(dto);
  }

  @Get()
  getAllCalendars() {
    return this.calendarService.findAll();
  }

  @Get('get-next-event')
  async getNextEvent() {
    const today = moment().format('YYYY-MM-DD');
    const events = await this.calendarService.findEventAfter(today);
    return events[0];
  }

  @Get(':id')
  getCalendarByUuid(@Param('id') id: number) {
    return this.calendarService.findById(id);
  }

  @Put(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: CalendarDto })
  updateCalendar(@Param('id') id: number, @Body() dto: CalendarDto) {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteCalendar(@Param('id') id: number) {
    return this.calendarService.delete(id);
  }
}
