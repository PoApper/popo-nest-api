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
import { ApiQuery, ApiTags } from '@nestjs/swagger';
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

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithNameAndId(@Body() dto: CreateReservePlaceDto) {
    const saveReserve = await this.reservePlaceService.saveWithNameAndId(dto);
    const existPlace = await this.placeService.findOne(dto.place);

    // Send e-mail to staff.
    this.mailService.sendPlaceReserveCreateMailToStaff(
      existPlace.staff_email ?? process.env.ADMIN_EMAIL,
      existPlace,
      saveReserve,
    );

    return saveReserve;
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

    const findOption = { where: whereOption, order: { createdAt: 'DESC' } };
    if (skip) {
      findOption['skip'] = skip;
    }
    if (take) {
      findOption['take'] = take;
    }

    const reservations = await this.reservePlaceService.find(findOption);

    const refined1 = await this.joinUser(reservations);
    return this.joinPlace(refined1);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  count() {
    return this.reservePlaceService.count();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getMyReservation(@Req() req: Request) {
    const user: any = req.user;
    const existUser = await this.userService.findOne({ id: user.id });

    const reservations = await this.reservePlaceService.find({
      where: { user: existUser.uuid },
      order: { createdAt: 'DESC' },
    });
    return this.joinPlace(reservations);
  }

  @Get('user/:uuid')
  @UseGuards(JwtAuthGuard)
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { user: uuid },
      order: { createdAt: 'DESC' },
    });
    return this.joinPlace(reservations);
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
    return this.joinUser(existReservations);
  }

  @Get('placeName/:placeName/:date') // hide user uuid
  async checkByPlaceNameAndDate(
    @Param('placeName') placeName: string,
    @Param('date') date: string,
  ) {
    const existReservations =
      await this.reservePlaceService.findAllByPlaceNameAndDate(placeName, date);
    return this.joinUser(existReservations);
  }

  @Get('placeName/:placeName/admin') // reveal user uuid
  getByPlaceName(@Param('placeName') placeName: string) {
    return this.reservePlaceService.findAllByPlaceName(placeName);
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
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('uuid') uuid: string) {
    return this.reservePlaceService.remove(uuid);
  }

  private async joinUser(reservations) {
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

  private async joinPlace(reservations) {
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
