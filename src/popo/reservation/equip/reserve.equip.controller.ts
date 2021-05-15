import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ReserveEquipService } from "./reserve.equip.service";
import { CreateReserveEquipDto } from "./reserve.equip.dto";
import { UserService } from "../../user/user.service";
import { MailService } from "../../../mail/mail.service";
import { ReservationStatus } from "../reservation.meta";
import { UserType } from "../../user/user.meta";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { Roles } from "../../../auth/authroization/roles.decorator";
import { RolesGuard } from "../../../auth/authroization/roles.guard";
import { Request } from "express";

@Controller("reservation-equip")
export class ReserveEquipController {
  constructor(
    private readonly reserveEquipService: ReserveEquipService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async post(@Body() dto: CreateReserveEquipDto) {
    return this.reserveEquipService.save(dto);
  }

  @Get()
  get(@Query("owner") owner: string, @Query("status") status: string) {
    if (status) {
      return this.reserveEquipService.find({ where: { reserveStatus: status }, order: { createdAt: "DESC" } });
    } else if (owner) {
      return this.reserveEquipService.find({ where: { owner: owner }, order: { createdAt: "DESC" } });
    } else {
      return this.reserveEquipService.find({ order: { createdAt: "DESC" } });
    }
  }

  @Get(":uuid")
  getOne(@Param("uuid") uuid) {
    return this.reserveEquipService.findOne(uuid);
  }

  @Delete(":uuid")
  @UseGuards(JwtAuthGuard)
  delete(@Param("uuid") uuid: string) {
    return this.reserveEquipService.remove(uuid);
  }

  /**
   * Additional APIs
   */


  @Patch(":uuid/status/:status")
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async patchStatus(@Param("uuid") uuid: string, @Param("status") status: string) {
    let response = await this.reserveEquipService.updateStatus(uuid, ReservationStatus[status]);

    // Send e-mail to client.
    const skipList = [UserType.admin, UserType.association, UserType.club];
    if (!skipList.includes(response.userType)) {
      await this.mailService.sendReserveStatusMail(response.email, response.title, ReservationStatus[status]);
    }
  }

}
