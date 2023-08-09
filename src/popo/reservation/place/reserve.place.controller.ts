import {
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
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger'
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

@ApiTags('Place Reservation')
@Controller('reservation-place')
export class ReservePlaceController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService,
    private readonly placeService: PlaceService,
    private readonly mailService: MailService,
  ) {}

  @Get('test')
  test() {
    this.reservePlaceService.testCalcuation();
  }

  @Post('check_possible')
  @ApiBody({
    type: CreateReservePlaceDto,
  })
  async checkReservationPossible(
    @Body() dto: CreateReservePlaceDto,
  ) {
    return this.reservePlaceService.checkReservationPossible(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithNameAndId(@Req() req, @Body() dto: CreateReservePlaceDto) {
    const user: any = req.user;
    const existPlace = await this.placeService.findOneByUuidOrFail(dto.place_id);

    await this.reservePlaceService.checkReservationPossible(dto);

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

  @Get('count')
  count() {
    return this.reservePlaceService.count();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getMyReservation(@Req() req: Request) {
    const user: any = req.user;

    const reservations = await this.reservePlaceService.find({
      where: { booker_id: user.uuid },
      order: { created_at: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @Get('user/:uuid')
  @UseGuards(JwtAuthGuard)
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { booker_id: uuid },
      order: { created_at: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @Get('place/:place_uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getByPlace(@Param('place_uuid') place_uuid: string) {
    return this.reservePlaceService.find({
      where: { place: place_uuid },
      order: { created_at: 'DESC' },
    });
  }

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

  @Get('placeName/:placeName/:date') // hide user uuid
  async checkByPlaceNameAndDate(
    @Param('placeName') placeName: string,
    @Param('date') date: string,
  ) {
    const existReservations =
      await this.reservePlaceService.findAllByPlaceNameAndDate(placeName, date);
    return this.reservePlaceService.joinBooker(existReservations);
  }

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
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async acceptAllStatus(
    @Body() body: AcceptPlaceReservationListDto,
    @Query('sendEmail') sendEmail?: string,
  ) {
    for (const reservation_uuid of body.uuid_list) {
      const response = await this.reservePlaceService.updateStatus(
        reservation_uuid,
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
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: string,
    @Query('sendEmail') sendEmail?: string,
  ) {
    const response = await this.reservePlaceService.updateStatus(
      uuid,
      ReservationStatus[status],
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

  @Delete(':uuid')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('uuid') uuid: string, @Req() req) {
    const reservation = await this.reservePlaceService.findOneByUuidOrFail(uuid);
    const user = req.user;

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reservePlaceService.remove(uuid);
    } else {
      if (reservation.booker_id == user.uuid) {
        await this.reservePlaceService.remove(uuid);
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
