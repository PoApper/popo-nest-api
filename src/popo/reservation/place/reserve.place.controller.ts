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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ReservePlaceService } from './reserve.place.service';
import {
  AcceptPlaceReservationListDto,
  AcceptPlaceReservationResultDto,
  CreateReservePlaceDto,
  SkippedPlaceReservationDto,
} from './reserve.place.dto';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { PlaceService } from '../../place/place.service';
import { JwtPayload } from '../../../auth/strategies/jwt.payload';
import { ReservePlace } from './reserve.place.entity';
import * as moment from 'moment-timezone';
import { Public } from 'src/common/public-guard.decorator';
import { User } from 'src/popo/common/user.decorator';

@ApiTags('Reservation - Place')
@Controller('reservation-place')
export class ReservePlaceController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService,
    private readonly placeService: PlaceService,
    private readonly mailService: MailService,
  ) {}

  @ApiCookieAuth()
  @Post('check_possible')
  @ApiBody({
    type: CreateReservePlaceDto,
  })
  async checkReservationPossible(
    @User() user: JwtPayload,
    @Body() dto: CreateReservePlaceDto,
  ) {
    return this.reservePlaceService.checkReservationPossible(
      dto,
      user.uuid,
      false,
    );
  }

  @ApiCookieAuth()
  @Post()
  async createWithNameAndId(
    @User() user: JwtPayload,
    @Body() dto: CreateReservePlaceDto,
  ) {
    const existPlace = await this.placeService.findOneByUuidOrFail(dto.placeId);

    await this.reservePlaceService.checkReservationPossible(
      dto,
      user.uuid,
      false,
    );

    const saveDto = Object.assign(dto, { bookerId: user.uuid });
    const new_reservation = await this.reservePlaceService.save(saveDto);

    // update place reservation count
    await this.placeService.updateReservationCountByDelta(dto.placeId, +1);

    // Send e-mail to staff
    await this.mailService.sendPlaceReserveCreateMailToStaff(
      existPlace.staffEmail,
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
  @ApiQuery({ name: 'placeId', required: false })
  @ApiQuery({ name: 'bookerId', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['createdAt', 'date'] })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'] })
  async getAll(
    @Query('status') status: string,
    @Query('date') date: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('placeId') placeId?: string,
    @Query('bookerId') bookerId?: string,
    @Query('title') title?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'date',
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
  ) {
    const reservations = await this.reservePlaceService.findByFilter(
      {
        status: status as ReservationStatus,
        date,
        placeId,
        bookerId,
        title,
        startDate,
        endDate,
        orderBy,
        orderDirection,
      },
      { skip, take },
    );

    const withBooker = await this.reservePlaceService.joinBooker(reservations);
    return this.reservePlaceService.joinPlace(withBooker);
  }

  @ApiCookieAuth()
  @Get('count')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'placeId', required: false })
  @ApiQuery({ name: 'bookerId', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  count(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('placeId') placeId?: string,
    @Query('bookerId') bookerId?: string,
    @Query('title') title?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // 필터를 주지 않으면 기존과 동일하게 전체 예약 건수를 돌려준다.
    return this.reservePlaceService.countByFilter({
      status: status as ReservationStatus,
      date,
      placeId,
      bookerId,
      title,
      startDate,
      endDate,
    });
  }

  @ApiCookieAuth()
  @Get('user')
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getMyReservation(
    @User() user: JwtPayload,
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    const findOption = {
      where: { bookerId: user.uuid },
      order: { date: 'DESC', startTime: 'DESC' },
    };

    const total = await this.reservePlaceService.count({
      bookerId: user.uuid,
    });

    findOption['skip'] = skip ?? 0;
    findOption['take'] = take ?? 10;

    const reservations = await this.reservePlaceService.find(findOption);
    return {
      items: await this.reservePlaceService.joinPlace(reservations),
      total: total,
    };
  }

  @ApiCookieAuth()
  @Get('user/:uuid')
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { bookerId: uuid },
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @ApiCookieAuth()
  @Get('user/admin/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async getUserReservationByAdmin(@Param('uuid') uuid: string) {
    const reservations = await this.reservePlaceService.find({
      where: { bookerId: uuid },
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return this.reservePlaceService.joinPlace(reservations);
  }

  @ApiCookieAuth()
  @Get('place/:placeUuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async getByPlace(@Param('placeUuid') placeUuid: string) {
    return this.reservePlaceService.find({
      where: { placeId: placeUuid },
      order: { date: 'DESC', startTime: 'DESC' },
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

  @ApiCookieAuth()
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

  @ApiCookieAuth()
  @Get('sync-reservation-count')
  async syncPlaceReservationCount() {
    const placeList = await this.placeService.find();
    for (const place of placeList) {
      const reservationCount = await this.reservePlaceService.count({
        placeId: place.uuid,
      });
      await this.placeService.updateReservationCount(
        place.uuid,
        reservationCount,
      );
    }
    return `Sync Done: ${placeList.length} Places`;
  }

  @ApiCookieAuth()
  @Patch('all/status/accept')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async acceptAllStatus(
    @Body() body: AcceptPlaceReservationListDto,
    @Query('sendEmail') sendEmail?: string,
    @User() user?: JwtPayload,
  ): Promise<AcceptPlaceReservationResultDto> {
    const reservations: ReservePlace[] = [];
    for (const reservationUuid of body.uuidList) {
      const reservation =
        await this.reservePlaceService.findOneByUuidOrFail(reservationUuid);
      reservations.push(reservation);
    }

    // early created reservation should be processed first
    reservations.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    const acceptedUuidList: string[] = [];
    const skippedList: SkippedPlaceReservationDto[] = [];

    for (const reservation of reservations) {
      // 중복 예약 등으로 승인할 수 없는 건은 건너뛰고 나머지 예약을 계속 처리한다.
      // 앞선 예약이 승인되면 그와 겹치는 뒤쪽 예약은 이 검사에서 자동으로 걸러진다.
      try {
        await this.reservePlaceService.checkReservationPossible(
          {
            placeId: reservation.placeId,
            date: reservation.date,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
          },
          reservation.bookerId,
          true,
        );
      } catch (error) {
        skippedList.push({
          uuid: reservation.uuid,
          title: reservation.title,
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          reason: error?.response?.message ?? error?.message ?? '승인 불가',
        });
        continue;
      }

      const response = await this.reservePlaceService.updateStatus(
        reservation.uuid,
        ReservationStatus.accept,
        user,
        '일괄 승인',
      );
      acceptedUuidList.push(reservation.uuid);

      if (sendEmail === 'true') {
        // Send e-mail to client.
        const skipList = [UserType.admin, UserType.association, UserType.club];
        if (!skipList.includes(response.userType)) {
          await this.mailService.sendReservationPatchMail(
            response.email,
            response.title,
            ReservationStatus.accept,
          );
        }
      }
    }

    return {
      totalCount: reservations.length,
      acceptedCount: acceptedUuidList.length,
      skippedCount: skippedList.length,
      acceptedUuidList: acceptedUuidList,
      skippedList: skippedList,
    };
  }

  @ApiCookieAuth()
  @Patch(':uuid/status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: ReservationStatus,
    @Query('sendEmail') sendEmail?: string,
    @User() user?: JwtPayload,
  ) {
    const reservation =
      await this.reservePlaceService.findOneByUuidOrFail(uuid);

    if (status == ReservationStatus.accept) {
      await this.reservePlaceService.checkReservationPossible(
        {
          placeId: reservation.placeId,
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
        },
        reservation.bookerId,
        true,
      );
    }

    const response = await this.reservePlaceService.updateStatus(
      uuid,
      status,
      user,
      '단건 상태 변경',
    );

    if (sendEmail === 'true') {
      // Send e-mail to client.
      const skipList = [UserType.admin, UserType.association, UserType.club];
      if (!skipList.includes(response.userType)) {
        await this.mailService.sendReservationPatchMail(
          response.email,
          response.title,
          status,
        );
      }
    }
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string, @User() user: JwtPayload) {
    const reservation =
      await this.reservePlaceService.findOneByUuidOrFail(uuid);

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reservePlaceService.remove(uuid, user);
    } else {
      if (reservation.bookerId === user.uuid) {
        // if the reservation is in the past, deny delete
        const reservationEndTime = reservation.date + reservation.endTime;
        const currentTime = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');

        if (reservationEndTime < currentTime) {
          throw new BadRequestException('Cannot delete past reservation');
        } else {
          await this.reservePlaceService.remove(uuid, user);
        }
      } else {
        throw new UnauthorizedException('Unauthorized delete action');
      }
    }

    // update place reservation count
    await this.placeService.updateReservationCountByDelta(
      reservation.placeId,
      -1,
    );
  }
}
