import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { ReserveEquipService } from './reserve.equip.service';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { UserService } from '../../user/user.service';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { EquipService } from '../../equip/equip.service';

@ApiTags('Reservation Equip')
@Controller('reservation-equip')
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly userService: UserService,
    private readonly equipService: EquipService,
    private readonly mailService: MailService,
  ) {}

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReserveEquipDto) {
    // admin 용 create
    return this.reserveEquipService.save(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async post(@Body() dto: CreateReserveEquipDto) {
    return this.reserveEquipService.save(dto);
  }

  @Get()
  @ApiQuery({ name: 'owner', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  get(
    @Query('owner') owner: string,
    @Query('status') status: string,
    @Query('date') date: string,
  ) {
    const whereOption = {};
    if (status) {
      whereOption['reserveStatus'] = status;
    }
    if (owner) {
      whereOption['owner'] = owner;
    }
    if (date) {
      whereOption['date'] = date;
    }

    return this.reserveEquipService.find({
      where: whereOption,
      order: { createdAt: 'DESC' },
    });
  }

  @Get('/owner/:ownerName')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  async getByOwnerAndHideUserUuid(
    @Param('ownerName') owner: string,
    @Query('status') status: string,
    @Query('date') date: string,
  ) {
    const whereOption = { owner: owner };
    if (status) {
      whereOption['reserveStatus'] = status;
    }
    if (date) {
      whereOption['date'] = date;
    }

    const reservs = await this.reserveEquipService.find({
      where: whereOption,
      order: { createdAt: 'DESC' },
    });

    const refined1 = await this.hideUserUuid(reservs);
    return this.hideEquipUuid(refined1);
  }

  @Get(':uuid')
  getOne(@Param('uuid') uuid) {
    return this.reserveEquipService.findOne(uuid);
  }

  @Delete(':uuid')
  @UseGuards(JwtAuthGuard)
  delete(@Param('uuid') uuid: string) {
    return this.reserveEquipService.remove(uuid);
  }

  /**
   * Additional APIs
   */

  @Patch(':uuid/status/:status')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async patchStatus(
    @Param('uuid') uuid: string,
    @Param('status') status: string,
    @Query('sendEmail') sendEmail?: boolean,
  ) {
    const response = await this.reserveEquipService.updateStatus(
      uuid,
      ReservationStatus[status],
    );

    if (sendEmail) {
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

  private async hideEquipUuid(reservations) {
    const refinedReservations = [];
    for (const reservation of reservations) {
      const new_equips = [];
      for (const equip_uuid of reservation.equips) {
        const equip = await this.equipService.findOne(equip_uuid);
        if (equip) {
          const { name } = equip;
          new_equips.push(name);
        }
      }
      reservation.equips = new_equips;
      refinedReservations.push(reservation);
    }
    return refinedReservations;
  }
}
