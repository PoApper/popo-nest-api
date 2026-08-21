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
import { ApiQuery, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ReserveEquipService } from './reserve.equip.service';
import {
  AcceptEquipReservationListDto,
  AcceptEquipReservationResultDto,
  CreateReserveEquipDto,
  SkippedEquipReservationDto,
} from './reserve.equip.dto';
import { ReserveEquip } from './reserve.equip.entity';
import { EquipOwner } from '../../equip/equip.meta';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { EquipService } from '../../equip/equip.service';
import { JwtPayload } from '../../../auth/strategies/jwt.payload';
import * as moment from 'moment-timezone';
import { Public } from 'src/common/public-guard.decorator';
import { User } from 'src/popo/common/user.decorator';

@ApiTags('Reservation - Equipment')
@Controller('reservation-equip')
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly equipService: EquipService,
    private readonly mailService: MailService,
  ) {}

  @ApiCookieAuth()
  @Post()
  async post(@User() user: JwtPayload, @Body() dto: CreateReserveEquipDto) {
    const saveDto = Object.assign(dto, { bookerId: user.uuid });
    const newReservation = await this.reserveEquipService.save(saveDto);

    const existEquips = await this.equipService.findByIds(dto.equipments);

    // update equipment reservation count
    for (const equipment of existEquips) {
      await this.equipService.updateReservationCountByDelta(equipment.uuid, +1);
    }

    const staffEmails = existEquips.map((equip) => equip.staffEmail);
    const uniqueEmails = new Set(staffEmails);

    // send e-mail to staff
    uniqueEmails.forEach((email) =>
      this.mailService.sendEquipReserveCreateMailToStaff(
        email,
        existEquips,
        newReservation,
      ),
    );

    // send e-mail to booker
    await this.mailService.sendEquipReserveCreateMailToBooker(
      user.email,
      newReservation,
    );

    return newReservation;
  }

  @Public()
  @Get()
  @ApiQuery({ name: 'owner', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'bookerId', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['createdAt', 'date'] })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'] })
  async getAll(
    @Query('owner') owner: string,
    @Query('status') status: string,
    @Query('date') date: string,
    @Query('startDate') startDate: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('bookerId') bookerId?: string,
    @Query('title') title?: string,
    @Query('endDate') endDate?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'date',
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
  ) {
    const reservations = await this.reserveEquipService.findByFilter(
      {
        owner: owner as EquipOwner,
        status: status as ReservationStatus,
        date,
        bookerId,
        title,
        startDate,
        endDate,
        orderBy,
        orderDirection,
      },
      { skip, take },
    );

    const withBooker = await this.reserveEquipService.joinBooker(reservations);
    return this.reserveEquipService.joinEquips(withBooker);
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

    const total = await this.reserveEquipService.count({
      bookerId: user.uuid,
    });

    findOption['skip'] = skip ?? 0;
    findOption['take'] = take ?? 10;

    const reservations = await this.reserveEquipService.find(findOption);
    return {
      items: await this.reserveEquipService.joinEquips(reservations),
      total: total,
    };
  }

  @ApiCookieAuth()
  @Get('user/:uuid')
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reserveEquipService.find({
      where: { bookerId: uuid },
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

  @ApiCookieAuth()
  @Get('user/admin/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async getUserReservationByAdmin(@Param('uuid') uuid: string) {
    const reservations = await this.reserveEquipService.find({
      where: { bookerId: uuid },
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

  // TODO: 이거 왜 GET?
  @ApiCookieAuth()
  @Get('sync-reservation-count')
  async syncPlaceReservationCount() {
    const equipmentList = await this.equipService.find();
    for (const equipment of equipmentList) {
      const reservationCount =
        await this.reserveEquipService.countEquipmentReservations(
          equipment.uuid,
        );
      await this.equipService.updateReservationCount(
        equipment.uuid,
        reservationCount,
      );
    }
    return `Sync Done: ${equipmentList.length} Equipments`;
  }

  @ApiCookieAuth()
  @Get('count')
  @ApiQuery({ name: 'owner', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'bookerId', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  count(
    @Query('owner') owner?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('bookerId') bookerId?: string,
    @Query('title') title?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // 필터를 주지 않으면 기존과 동일하게 전체 예약 건수를 돌려준다.
    return this.reserveEquipService.countByFilter({
      owner: owner as EquipOwner,
      status: status as ReservationStatus,
      date,
      bookerId,
      title,
      startDate,
      endDate,
    });
  }

  @ApiCookieAuth()
  @Get(':uuid')
  getOne(@Param('uuid') uuid) {
    return this.reserveEquipService.findOneByUuid(uuid);
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string, @User() user: JwtPayload) {
    const reservation = await this.reserveEquipService.findOneByUuid(uuid);

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reserveEquipService.remove(uuid, user);
    } else {
      if (reservation.bookerId == user.uuid) {
        // if the reservation is in the past, deny delete
        const reservationEndTime = reservation.date + reservation.endTime;
        const currentTime = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');

        if (reservationEndTime < currentTime) {
          throw new BadRequestException('Cannot delete past reservation');
        } else {
          await this.reserveEquipService.remove(uuid, user);
        }
      } else {
        throw new UnauthorizedException('Unauthorized delete action');
      }
    }

    // update equipment reservation count
    for (const equipmentId of reservation.equipments) {
      await this.equipService.updateReservationCountByDelta(equipmentId, -1);
    }
  }

  /**
   * 장비 예약을 승인할 수 있는지 검사한다. 승인 불가 시 BadRequestException 을 던진다.
   * 단건 승인과 일괄 승인이 동일한 기준을 쓰도록 분리했다.
   */
  private async assertReservationAcceptable(reservation: ReserveEquip) {
    await this.reserveEquipService.assertReservationRequiredDays(
      reservation.equipments,
      reservation.date,
    );
    await this.reserveEquipService.assertReservationOpeningHours(
      reservation.equipments,
      reservation.date,
      reservation.startTime,
      reservation.endTime,
    );

    const isOverlap = await this.reserveEquipService.isReservationOverlap(
      reservation.equipments,
      reservation.date,
      reservation.startTime,
      reservation.endTime,
    );
    if (isOverlap) {
      throw new BadRequestException('Reservation time overlapped.');
    }
  }

  @ApiCookieAuth()
  @Patch('all/status/accept')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async acceptAllStatus(
    @Body() body: AcceptEquipReservationListDto,
    @Query('sendEmail') sendEmail?: string,
    @User() user?: JwtPayload,
  ): Promise<AcceptEquipReservationResultDto> {
    const reservations: ReserveEquip[] = [];
    const acceptedUuidList: string[] = [];
    const skippedList: SkippedEquipReservationDto[] = [];

    for (const reservationUuid of body.uuidList) {
      const reservation =
        await this.reserveEquipService.findOneByUuid(reservationUuid);
      if (!reservation) {
        skippedList.push({
          uuid: reservationUuid,
          title: '(알 수 없음)',
          date: '',
          startTime: '',
          endTime: '',
          reason: '존재하지 않는 예약입니다.',
        });
        continue;
      }
      reservations.push(reservation);
    }

    // 먼저 생성된 예약을 먼저 처리한다.
    reservations.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    for (const reservation of reservations) {
      // 중복 예약 등으로 승인할 수 없는 건은 건너뛰고 나머지 예약을 계속 처리한다.
      try {
        await this.assertReservationAcceptable(reservation);
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

      const response = await this.reserveEquipService.updateStatus(
        reservation.uuid,
        ReservationStatus.accept,
        user,
        '일괄 승인',
      );
      acceptedUuidList.push(reservation.uuid);

      if (sendEmail === 'true') {
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
      totalCount: body.uuidList.length,
      acceptedCount: acceptedUuidList.length,
      skippedCount: skippedList.length,
      acceptedUuidList: acceptedUuidList,
      skippedList: skippedList,
    };
  }

  @ApiCookieAuth()
  @Patch('all/status/reject')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async rejectAllStatus(
    @Body() body: AcceptEquipReservationListDto,
    @Query('sendEmail') sendEmail?: string,
    @User() user?: JwtPayload,
  ): Promise<AcceptEquipReservationResultDto> {
    // 거절은 승인과 달리 중복 검사를 할 필요가 없어 요청한 건을 그대로 처리한다.
    const acceptedUuidList: string[] = [];
    const skippedList: SkippedEquipReservationDto[] = [];

    for (const reservationUuid of body.uuidList) {
      try {
        const response = await this.reserveEquipService.updateStatus(
          reservationUuid,
          ReservationStatus.reject,
          user,
          '일괄 거절',
        );
        acceptedUuidList.push(reservationUuid);

        if (sendEmail === 'true') {
          const skipList = [
            UserType.admin,
            UserType.association,
            UserType.club,
          ];
          if (!skipList.includes(response.userType)) {
            await this.mailService.sendReservationPatchMail(
              response.email,
              response.title,
              ReservationStatus.reject,
            );
          }
        }
      } catch (error) {
        // 한 건이 실패해도 나머지를 계속 처리하고, 실패 목록을 함께 돌려준다.
        const reservation =
          await this.reserveEquipService.findOneByUuid(reservationUuid);
        skippedList.push({
          uuid: reservationUuid,
          title: reservation?.title ?? '(알 수 없음)',
          date: reservation?.date ?? '',
          startTime: reservation?.startTime ?? '',
          endTime: reservation?.endTime ?? '',
          reason: error?.response?.message ?? error?.message ?? '거절 불가',
        });
      }
    }

    return {
      totalCount: body.uuidList.length,
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
    @Query('sendEmail') sendEmail?: boolean,
    @User() user?: JwtPayload,
  ) {
    const reservation =
      await this.reserveEquipService.findOneByUuidOrFail(uuid);

    // When accepting, validate overlap against already accepted reservations
    if (status === ReservationStatus.accept) {
      await this.assertReservationAcceptable(reservation);
    }

    const response = await this.reserveEquipService.updateStatus(
      uuid,
      status,
      user,
      '단건 상태 변경',
    );

    if (sendEmail) {
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
}
