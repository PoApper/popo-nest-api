import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ReservePlaceService } from './reserve.place.service';
import {
  AcceptPlaceReservationListDto,
  CreateReservePlaceDto,
} from './reserve.place.dto';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { PlaceService } from '../../place/place.service';
import { JwtPayload } from '../../../auth/strategies/jwt.payload';
import { ReservePlace } from './reserve.place.entity';
import * as moment from 'moment-timezone';
import { Public } from 'src/common/public-guard.decorator';

@ApiCookieAuth()
@ApiTags('Reservation - Place')
@Controller('reservation-place')
export class ReservePlaceController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService,
    private readonly placeService: PlaceService,
    private readonly mailService: MailService,
  ) {}

  @Post('check_possible')
  @ApiBody({
    type: CreateReservePlaceDto,
  })
  async checkReservationPossible(
    @Req() req,
    @Body() dto: CreateReservePlaceDto,
  ) {
    const user = req.user as JwtPayload;

    return this.reservePlaceService.checkReservationPossible(
      dto,
      user.uuid,
      false,
    );
  }

  @Post()
  async createWithNameAndId(
    @Req() req: Request,
    @Body() dto: CreateReservePlaceDto,
  ) {
    const user = req.user as JwtPayload;
    const existPlace = await this.placeService.findOneByUuidOrFail(
      dto.place_id,
    );

    await this.reservePlaceService.checkReservationPossible(
      dto,
      user.uuid,
      false,
    );

    const new_reservation = await this.reservePlaceService.save(
      Object.assign(dto, { booker_id: user.uuid }),
    );

    // update place reservation count
    await this.placeService.updateReservationCountByDelta(dto.place_id, +1);

    // Send e-mail to staff
    await this.mailService.sendPlaceReserveCreateMailToStaff(
      existPlace.staff_email,
      existPlace,
      new_reservation,
    );

    // Send e-mail to booker
    await this.mailService.sendPlaceReserveCreateMailToBooker(
      user.email,
      existPlace,
      new_reservation,
    );

    return new_reservation;
  }

  @Public()
  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getAll(
    @Query('status') status: string,
    @Query('date') date: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    const whereOption = {};
    if (status) {
      whereOption['status'] = status;
    }
    if (date) {
      whereOption['date'] = date;
    }

    const findOption = { where: whereOption, order: { created_at: 'DESC' } };
    if (skip) {
      findOption['skip'] = skip;
    }
    if (take) {
      findOption['take'] = take;
    }

    let reservations = await this.reservePlaceService.find(findOption);
    reservations = await this.reservePlaceService.joinBooker(reservations);
    return this.reservePlaceService.joinPlace(reservations);
  }

  @Public()
  @Get('count')
  count() {
    return this.reservePlaceService.count();
  }

  @Public()
  @Get('user')
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getMyReservation(
    @Req() req: Request,
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    const user = req.user as JwtPayload;

    const findOption = {
      where: { booker_id: user.uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    };

    const total = await this.reservePlaceService.count({
      booker_id: user.uuid,
    });

    findOption['skip'] = skip ?? 0;
    findOption['take'] = take ?? 10;

    const reservations = await this.reservePlaceService.find(findOption);
    return {
      items: await this.reservePlaceService.joinPlace(reservations),
      total: total,
    };
  }

  @Public()
  @Get('user/:uuid')
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { booker_id: uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @Get('user/admin/:uuid')
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserReservationByAdmin(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { booker_id: uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @Get('place/:place_uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async getByPlace(@Param('place_uuid') place_uuid: string) {
    return this.reservePlaceService.find({
      where: { place: place_uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    });
  }

  @Public()
  @Get('placeName/:placeName') // hide user uuid
  @ApiQuery({ name: 'startDate', required: false })
  async checkByPlaceName(
    @Param('placeName') placeName: string,
    @Query('startDate') startDate: string,
  ) {
    const existReservations = await this.reservePlaceService.findAllByPlaceName(
      placeName,
      startDate,
    );
    return this.reservePlaceService.joinBooker(existReservations);
  }

  @Public()
  @Get('placeName/:placeName/:date') // hide user uuid
  async checkByPlaceNameAndDate(
    @Param('placeName') placeName: string,
    @Param('date') date: string,
  ) {
    const existReservations =
      await this.reservePlaceService.findAllByPlaceNameAndDate(placeName, date);
    return this.reservePlaceService.joinBooker(existReservations);
  }

  @Public()
  @Get('sync-reservation-count')
  async syncPlaceReservationCount() {
    const placeList = await this.placeService.find();
    for (const place of placeList) {
      const reservationCount = await this.reservePlaceService.count({
        place_id: place.uuid,
      });
      await this.placeService.updateReservationCount(
        place.uuid,
        reservationCount,
      );
    }
    return `Sync Done: ${placeList.length} Places`;
  }

  @Patch('all/status/accept')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async acceptAllStatus(
    @Body() body: AcceptPlaceReservationListDto,
    @Query('sendEmail') sendEmail?: string,
  ) {
    const reservations: ReservePlace[] = [];
    for (const reservation_uuid of body.uuid_list) {
      const reservation =
        await this.reservePlaceService.findOneByUuidOrFail(reservation_uuid);
      reservations.push(reservation);
    }

    // early created reservation should be processed first
    reservations.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));

    for (const reservation of reservations) {
      await this.reservePlaceService.checkReservationPossible(
        {
          place_id: reservation.place_id,
          date: reservation.date,
          start_time: reservation.start_time,
          end_time: reservation.end_time,
        },
        reservation.booker_id,
        true,
      );
      const response = await this.reservePlaceService.updateStatus(
        reservation.uuid,
        ReservationStatus.accept,
      );

      if (sendEmail === 'true') {
        // Send e-mail to client.
        const skipList = [UserType.admin, UserType.association, UserType.club];
        if (!skipList.includes(response.userType)) {
          await this.mailService.sendReservationPatchMail(
            response.email,
            response.title,
            ReservationStatus[status],
          );
        }
      }
    }
  }

  @Patch(':uuid/status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: ReservationStatus,
    @Query('sendEmail') sendEmail?: string,
  ) {
    const reservation =
      await this.reservePlaceService.findOneByUuidOrFail(uuid);

    if (status == ReservationStatus.accept) {
      await this.reservePlaceService.checkReservationPossible(
        {
          place_id: reservation.place_id,
          date: reservation.date,
          start_time: reservation.start_time,
          end_time: reservation.end_time,
        },
        reservation.booker_id,
        true,
      );
    }

    const response = await this.reservePlaceService.updateStatus(uuid, status);

    if (sendEmail === 'true') {
      // Send e-mail to client.
      const skipList = [UserType.admin, UserType.association, UserType.club];
      if (!skipList.includes(response.userType)) {
        await this.mailService.sendReservationPatchMail(
          response.email,
          response.title,
          ReservationStatus[status],
        );
      }
    }
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string, @Req() req: Request) {
    const reservation =
      await this.reservePlaceService.findOneByUuidOrFail(uuid);
    const user = req.user as JwtPayload;

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reservePlaceService.remove(uuid);
    } else {
      if (reservation.booker_id == user.uuid) {
        // if the reservation is in the past, deny delete
        const reservation_start_time =
          reservation.date + reservation.start_time;
        const current_time = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');

        if (reservation_start_time < current_time) {
          throw new BadRequestException('Cannot delete past reservation');
        } else {
          await this.reservePlaceService.remove(uuid);
        }
      } else {
        throw new UnauthorizedException('Unauthorized delete action');
      }
    }

    // update place reservation count
    await this.placeService.updateReservationCountByDelta(
      reservation.place_id,
      -1,
    );
  }
}
