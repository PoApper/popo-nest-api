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
import { ApiQuery, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Request } from 'express';
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

@ApiCookieAuth()
@ApiTags('Reservation - Equipment')
@Controller('reservation-equip')
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly equipService: EquipService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  async post(@Req() req: Request, @Body() dto: CreateReserveEquipDto) {
    const user = req.user as JwtPayload;

    const saveDto = Object.assign(dto, { booker_id: user.uuid });
    const new_reservation = await this.reserveEquipService.save(
      saveDto,
      user.uuid,
    );

    const existEquips = await this.equipService.findByIds(dto.equipments);

    // update equipment reservation count
    for (const equipment of existEquips) {
      await this.equipService.updateReservationCountByDelta(equipment.uuid, +1);
    }

    const staff_emails = existEquips.map((equip) => equip.staff_email);
    const unique_emails = new Set(staff_emails);

    // send e-mail to staff
    unique_emails.forEach((email) =>
      this.mailService.sendEquipReserveCreateMailToStaff(
        email,
        existEquips,
        new_reservation,
      ),
    );

    // send e-mail to booker
    await this.mailService.sendEquipReserveCreateMailToBooker(
      user.email,
      new_reservation,
    );

    return new_reservation;
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

    const findOption = { where: whereOption, order: { created_at: 'DESC' } };
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

    const total = await this.reserveEquipService.count({
      booker_id: user.uuid,
    });

    findOption['skip'] = skip ?? 0;
    findOption['take'] = take ?? 10;

    const reservations = await this.reserveEquipService.find(findOption);
    return {
      items: await this.reserveEquipService.joinEquips(reservations),
      total: total,
    };
  }

  @Get('user/:uuid')
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reserveEquipService.find({
      where: { booker_id: uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

  @Get('user/admin/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async getUserReservationByAdmin(@Param('uuid') uuid: string) {
    const reservations = await this.reserveEquipService.find({
      where: { booker_id: uuid },
      order: { date: 'DESC', start_time: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

  // TODO: 이거 왜 GET?
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

  @Get('count')
  count() {
    return this.reserveEquipService.count();
  }

  @Get(':uuid')
  getOne(@Param('uuid') uuid) {
    return this.reserveEquipService.findOneByUuid(uuid);
  }

  @Delete(':uuid')
  async delete(@Param('uuid') uuid: string, @Req() req: Request) {
    const reservation = await this.reserveEquipService.findOneByUuid(uuid);
    const user = req.user as JwtPayload;

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reserveEquipService.remove(uuid);
    } else {
      if (reservation.booker_id == user.uuid) {
        // if the reservation is in the past, deny delete
        const reservation_start_time =
          reservation.date + reservation.start_time;
        const current_time = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');

        if (reservation_start_time < current_time) {
          throw new BadRequestException('Cannot delete past reservation');
        } else {
          await this.reserveEquipService.remove(uuid);
        }
      } else {
        throw new UnauthorizedException('Unauthorized delete action');
      }
    }

    // update equipment reservation count
    for (const equipment_id of reservation.equipments) {
      await this.equipService.updateReservationCountByDelta(equipment_id, -1);
    }
  }

  @Patch(':uuid/status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: ReservationStatus,
    @Query('sendEmail') sendEmail?: boolean,
  ) {
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
