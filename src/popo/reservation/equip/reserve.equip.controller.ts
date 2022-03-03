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

import { ReserveEquipService } from './reserve.equip.service';
import { CreateReserveEquipDto } from './reserve.equip.dto';
import { MailService } from '../../../mail/mail.service';
import { ReservationStatus } from '../reservation.meta';
import { UserType } from '../../user/user.meta';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { EquipService } from '../../equip/equip.service';

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
    const user: any = req.user;

    const saveDto = Object.assign(dto, { booker_id: user.uuid });
    const new_reservation = await this.reserveEquipService.save(saveDto);

    const existEquips = await this.equipService.findByIds(dto.equipments);

    const staff_emails = existEquips.map((equip) => equip.staff_email);
    const unique_emails = new Set(staff_emails);

    // send e-mail to booker
    await this.mailService.sendEquipReserveCreateMailToBooker(
      user.email,
      new_reservation,
    );

    // send e-mail to staff
    unique_emails.forEach((email) =>
      this.mailService.sendEquipReserveCreateMailToStaff(
        email,
        existEquips,
        new_reservation,
      ),
    );

    return new_reservation;
  }

  @Get('count')
  countAll() {
    return this.reserveEquipService.count();
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
    const user: any = req.user;

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
        await this.mailService.sendReservationPatchMail(
          response.email,
          response.title,
          ReservationStatus[status],
        );
      }
    }
  }
}
