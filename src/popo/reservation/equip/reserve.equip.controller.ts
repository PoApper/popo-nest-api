import {Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards} from '@nestjs/common';
import {ReserveEquipService} from "./reserve.equip.service";
import {CreateReserveEquipDto} from "./reserve.equip.dto";
import {UserService} from "../../user/user.service";
import {MailService} from "../../../mail/mail.service";
import {ReservationStatus} from "../reservation.meta";
import {UserType} from "../../user/user.meta";
import {JwtAuthGuard} from "../../../auth/guards/jwt-auth.guard";
import {Roles} from "../../../auth/authroization/roles.decorator";
import {RolesGuard} from "../../../auth/authroization/roles.guard";
import {Request} from "express";

@Controller('reservation-equip')
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReserveEquipDto) {
    const saveReserve = this.reserveEquipService.save(dto);

    // 예약 생성시 담당자에게 메일 보내기

    // this.mailService.sendReserveCreateToStaff()

    return saveReserve;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithNameAndId(@Body() dto: CreateReserveEquipDto) {
    // 예약 생성시 예약 확인 메일 보내기
    const saveReserve = this.reserveEquipService.saveWithNameAndId(dto);
    return saveReserve;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  getAll() {
    return this.reserveEquipService.findAll();
  }

  @Get('equip/:equip_uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllByEquip(@Param('equip_uuid') equip_uuid: string) {
    return this.reserveEquipService.findAllByEquip(equip_uuid);
  }

  @Get('equipName/:equipName') // hide user uuid
  async checkByEquipName(@Param('equipName') equipName: string) {
    const existReservations = await this.reserveEquipService.findAllByEquipName(equipName);
    return this.hideUserUuid(existReservations);
  }

  @Get('equipName/:equipName/:date') // hide user uuid
  async checkByEquipNameAndDate(@Param('equipName') equipName: string, @Param('date') date: number) {
    const existReservations = await this.reserveEquipService.findAllByEquipNameAndDate(equipName, date);
    return this.hideUserUuid(existReservations);
  }

  @Get('equipName/:equipName/admin') // reveal user uuid
  getAllByEquipName(@Param('equipName') equipName: string) {
    return this.reserveEquipService.findAllByEquipName(equipName);
  }

  @Get('date/:date')
  getAllByDate(@Param('date') date: number) {
    return this.reserveEquipService.findAllByDate(date);
  }

  @Get('reserveStatus/:status')
  @UseGuards(JwtAuthGuard)
  getAllByStatusWithUserName(@Param('status') reserve_status: ReservationStatus) {
    return this.reserveEquipService.findAllByStatus(reserve_status);
  }

  @Patch(':uuid/status/:status')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async patchStatus(@Param('uuid') uuid: string, @Param('status') status: string) {
    let response = await this.reserveEquipService.updateStatus(uuid, ReservationStatus[status]);

    const skipList = [UserType.admin, UserType.association, UserType.club];
    if (!skipList.includes(response.userType)) {
      await this.mailService.sendReserveStatusMail(response.email, response.title, ReservationStatus[status]);
    }
  }

  @Delete(':uuid')
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('uuid') uuid: string) {
    this.reserveEquipService.remove(uuid);
  }

  private async hideUserUuid(reservations) {
    const refinedReservations = [];

    for (const reservation of reservations) {
      const user = await this.userService.findOne(reservation.user);
      const {name} = user;
      reservation.user = name;
      refinedReservations.push(reservation);
    }
    return refinedReservations;
  }
}
