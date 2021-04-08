import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ReservePlaceService } from "./reserve.place.service";
import { CreateReservePlaceDto } from "./reserve.place.dto";
import { UserService } from "../../user/user.service";
import { MailService } from "../../../mail/mail.service";
import { ReservationStatus } from "../reservation.meta";
import { UserType } from "../../user/user.meta";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { Roles } from "../../../auth/authroization/roles.decorator";
import { RolesGuard } from "../../../auth/authroization/roles.guard";
import { Request } from "express";

@Controller("reservation-place")
export class ReservePlaceController {
  constructor(
    private readonly reservePlaceService: ReservePlaceService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {
  }

  @Post("admin")
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReservePlaceDto) {
    // admin 용 create
    const saveReserve = this.reservePlaceService.save(dto);
    return saveReserve;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWithNameAndId(@Body() dto: CreateReservePlaceDto) {
    const saveReserve = await this.reservePlaceService.saveWithNameAndId(dto);

    // Send e-mail to staff.
    this.mailService.sendReserveCreateToStaff(process.env.ADMIN_EMAIL, saveReserve.title);

    return saveReserve;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin, UserType.association, UserType.staff)
  get() {
    return this.reservePlaceService.find({ order: { createdAt: "DESC" } });
  }

  @Get("place/:place_uuid")
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getByPlace(@Param("place_uuid") place_uuid: string) {
    return this.reservePlaceService.find({ where: { place: place_uuid }, order: { createdAt: "DESC" } });
  }

  @Get("placeName/:placeName") // hide user uuid
  async checkByPlaceName(@Param("placeName") placeName: string) {
    const existReservations = await this.reservePlaceService.findAllByPlaceName(placeName);
    return this.hideUserUuid(existReservations);
  }

  @Get("placeName/:placeName/:date") // hide user uuid
  async checkByPlaceNameAndDate(@Param("placeName") placeName: string, @Param("date") date: number) {
    const existReservations = await this.reservePlaceService.findAllByPlaceNameAndDate(placeName, date);
    return this.hideUserUuid(existReservations);
  }

  @Get("placeName/:placeName/admin") // reveal user uuid
  getByPlaceName(@Param("placeName") placeName: string) {
    return this.reservePlaceService.findAllByPlaceName(placeName);
  }

  @Get("date/:date")
  getByDate(@Param("date") date: number) {
    return this.reservePlaceService.find({ date: date });
  }

  @Get("reserveStatus/:status")
  @UseGuards(JwtAuthGuard)
  getAllByStatusWithUserName(@Param("status") reserve_status: ReservationStatus) {
    return this.reservePlaceService.find({ reserveStatus: reserve_status });
  }

  @Patch(":uuid/status/:status")
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async patchStatus(@Param("uuid") uuid: string, @Param("status") status: string) {
    let response = await this.reservePlaceService.updateStatus(uuid, ReservationStatus[status]);

    // Send e-mail to client.
    const skipList = [UserType.admin, UserType.association, UserType.club];
    if (!skipList.includes(response.userType)) {
      await this.mailService.sendReserveStatusMail(response.email, response.title, ReservationStatus[status]);
    }
  }

  @Delete(":uuid")
  @Roles(UserType.admin, UserType.association, UserType.staff)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param("uuid") uuid: string) {
    return this.reservePlaceService.remove(uuid);
  }


  @Get(["user", "user/:uuid"])
  @UseGuards(JwtAuthGuard)
  async getUserReservation(@Req() req: Request, @Param("uuid") uuid: string) {
    if (uuid) {
      return await this.reservePlaceService.find({ where: { user: uuid }, order: { createdAt: "DESC" } });
    } else {
      // 내 예약 조회
      const user: any = req.user;
      const existUser = await this.userService.findOne({ id: user.id });

      return await this.reservePlaceService.find({ where: { user: existUser.uuid }, order: { createdAt: "DESC" } });
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
}
