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
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { EquipService } from '../../equip/equip.service';
import { MoreThanOrEqual } from 'typeorm';
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
  async getAll(
    @Query('owner') owner: string,
    @Query('status') status: string,
    @Query('date') date: string,
    @Query('startDate') startDate: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    const whereOption = {};
    if (owner) {
      whereOption['owner'] = owner;
    }
    if (status) {
      whereOption['status'] = status;
    }
    if (date) {
      whereOption['date'] = date;
    }
    if (startDate) {
      whereOption['date'] = MoreThanOrEqual(startDate);
    }

    const findOption = { where: whereOption, order: { createdAt: 'DESC' } };
    if (skip) {
      findOption['skip'] = skip;
    }
    if (take) {
      findOption['take'] = take;
    }

    let reservations = await this.reserveEquipService.find(findOption);
    reservations = await this.reserveEquipService.joinBooker(reservations);
    return this.reserveEquipService.joinEquips(reservations);
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
  count() {
    return this.reserveEquipService.count();
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
      await this.reserveEquipService.remove(uuid);
    } else {
      if (reservation.bookerId == user.uuid) {
        // if the reservation is in the past, deny delete
        const reservationEndTime = reservation.date + reservation.endTime;
        const currentTime = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');

        if (reservationEndTime < currentTime) {
          throw new BadRequestException('Cannot delete past reservation');
        } else {
          await this.reserveEquipService.remove(uuid);
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

  @ApiCookieAuth()
  @Patch(':uuid/status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: ReservationStatus,
    @Query('sendEmail') sendEmail?: boolean,
  ) {
    const reservation =
      await this.reserveEquipService.findOneByUuidOrFail(uuid);

    // When accepting, validate overlap against already accepted reservations
    if (status === ReservationStatus.accept) {
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

    const response = await this.reserveEquipService.updateStatus(uuid, status);

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
