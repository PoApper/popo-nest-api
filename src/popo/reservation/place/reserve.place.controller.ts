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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { ReservePlaceService } from './reserve.place.service';
import { CreateReservePlaceDto } from './reserve.place.dto';
import { UserService } from '../../user/user.service';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { PlaceService } from '../../place/place.service';

@ApiTags('Reservation Place')
@Controller('reservation-place')
export class ReservePlaceController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService,
    private readonly placeService: PlaceService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReservePlaceDto) {
    // admin 용 create
    return this.reservePlaceService.save(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithNameAndId(@Body() dto: CreateReservePlaceDto) {
    const saveReserve = await this.reservePlaceService.saveWithNameAndId(dto);
    const existPlace = await this.placeService.findOne(dto.place);

    // Send e-mail to staff.
    this.mailService.sendReserveCreateToStaff(
      existPlace.staff_email ?? process.env.ADMIN_EMAIL,
      existPlace,
      saveReserve,
    );

    return saveReserve;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  get(@Query('page') page: number) {
    if (!page) {
      return this.reservePlaceService.find({ order: { createdAt: 'DESC' } });
    }

    const pageSize = 10;
    return this.reservePlaceService.find({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
  }

  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  count() {
    return this.reservePlaceService.count();
  }

  @Get(['user', 'user/:uuid'])
  @UseGuards(JwtAuthGuard)
  async getUserReservation(@Req() req: Request, @Param('uuid') uuid: string) {
    if (uuid) {
      return await this.reservePlaceService.find({
        where: { user: uuid },
        order: { createdAt: 'DESC' },
      });
    } else {
      // 내 예약 조회
      const user: any = req.user;
      const existUser = await this.userService.findOne({ id: user.id });

      const reservs = await this.reservePlaceService.find({
        where: { user: existUser.uuid },
        order: { createdAt: 'DESC' },
      });
      return this.hidePlaceUuid(reservs);
    }
  }

  @Get('place/:place_uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getByPlace(@Param('place_uuid') place_uuid: string) {
    return this.reservePlaceService.find({
      where: { place: place_uuid },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('placeName/:placeName') // hide user uuid
  async checkByPlaceName(@Param('placeName') placeName: string) {
    const existReservations = await this.reservePlaceService.findAllByPlaceName(
      placeName,
    );
    return this.hideUserUuid(existReservations);
  }

  @Get('placeName/:placeName/:date') // hide user uuid
  async checkByPlaceNameAndDate(
    @Param('placeName') placeName: string,
    @Param('date') date: number,
  ) {
    const existReservations =
      await this.reservePlaceService.findAllByPlaceNameAndDate(placeName, date);
    return this.hideUserUuid(existReservations);
  }

  @Get('placeName/:placeName/admin') // reveal user uuid
  getByPlaceName(@Param('placeName') placeName: string) {
    return this.reservePlaceService.findAllByPlaceName(placeName);
  }

  @Get('date/:date')
  getByDate(@Param('date') date: number) {
    return this.reservePlaceService.find({ date: date });
  }

  @Get('reserveStatus/:status')
  @UseGuards(JwtAuthGuard)
  getAllByStatusWithUserName(
    @Param('status') reserve_status: ReservationStatus,
  ) {
    return this.reservePlaceService.find({ reserveStatus: reserve_status });
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

    console.log(
      'chechckc',
      sendEmail,
      sendEmail === 'true',
      sendEmail === 'false',
    );

    if (sendEmail === 'true') {
      // Send e-mail to client.
      const skipList = [UserType.admin, UserType.association, UserType.club];
      if (!skipList.includes(response.userType)) {
        await this.mailService.sendReserveStatusMail(
          response.email,
          response.title,
          ReservationStatus[status],
        );
      }
    }
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('uuid') uuid: string) {
    return this.reservePlaceService.remove(uuid);
  }

  private async hideUserUuid(reservations) {
    const refinedReservations = [];

    for (const reservation of reservations) {
      const user = await this.userService.findOne(reservation.user);
      if (user) {
        const { name } = user;
        reservation.user = name;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }

  private async hidePlaceUuid(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const place = await this.placeService.findOne(reservation.place);
      if (place) {
        const { name } = place;
        reservation.place = name;
        refinedReservations.push(reservation);
      }
    }
    return refinedReservations;
  }
}
