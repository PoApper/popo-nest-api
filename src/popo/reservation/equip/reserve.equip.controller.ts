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
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { ReserveEquipService } from './reserve.equip.service';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { EquipService } from '../../equip/equip.service';
import { MoreThanOrEqual } from 'typeorm';
import {JwtPayload} from "../../../auth/strategies/jwt.payload";
import * as moment from 'moment-timezone';

@ApiTags('Equipment Reservation')
@Controller('reservation-equip')
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly equipService: EquipService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async post(@Req() req, @Body() dto: CreateReserveEquipDto) {
    const user = req.user as JwtPayload;

    const saveDto = Object.assign(dto, { booker_id: user.uuid });
    const new_reservation = await this.reserveEquipService.save(saveDto, user.uuid);

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
  @UseGuards(JwtAuthGuard)
  async getMyReservation(@Req() req) {
    const user = req.user as JwtPayload;

    const reservations = await this.reserveEquipService.find({
      where: { booker_id: user.uuid },
      order: { created_at: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

  @Get('user/:uuid')
  @UseGuards(JwtAuthGuard)
  async getUserReservation(@Param('uuid') uuid: string) {
    const reservations = await this.reserveEquipService.find({
      where: { booker_id: uuid },
      order: { created_at: 'DESC' },
    });
    return this.reserveEquipService.joinEquips(reservations);
  }

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
  @UseGuards(JwtAuthGuard)
  async delete(@Param('uuid') uuid: string, @Req() req) {
    const reservation = await this.reserveEquipService.findOneByUuid(uuid);
    const user = req.user as JwtPayload;

    if (user.userType == UserType.admin || user.userType == UserType.staff) {
      await this.reserveEquipService.remove(uuid);
    } else {
      if (reservation.booker_id == user.uuid) {
        // if the reservation is in the past, deny delete
        const reservation_time = reservation.date + reservation.start_time;
        const current_time = moment().tz('Asia/Seoul').format('YYYYMMDDHHmm');
        
        if (reservation_time < current_time) {
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
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
