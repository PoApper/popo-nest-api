import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {Request, Response} from "express";
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {UserStatus, UserType} from "../popo/user/user.meta";
import {UserService} from "../popo/user/user.service";
import {CreateUserDto} from "../popo/user/user.dto";
import {MailService} from "../mail/mail.service";
import {ReservePlaceService} from "../popo/reservation/place/reserve.place.service";

const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

const Message = {
  FAIL_VERIFICATION_EMAIL_SEND: "Fail to send verification email.",
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly reservePlaceService: ReservePlaceService,
  ) {
  }

  @Get(['verifyToken', 'verifyToken/admin'])
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: Request) {
    const path = req.path;
    const user: any = req.user;
    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException();
      }
    }
    this.userService.updateLoginById(user.id)
    return user;
  }

  // HttpOnly: 자바스크립트의 document.cookie를 이용해서 쿠키에 접속하는 것을 막는 옵션
  // 즉, 쿠키를 훔쳐가는 행위를 막기 위한 방법이다.
  @UseGuards(LocalAuthGuard)
  @Post(['login', 'login/admin'])
  async logIn(@Req() req: Request, @Res() res: Response) {
    const path = req.path;
    const user: any = req.user;

    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException("Not authorized account.");
      }
    }
    const token = await this.authService.generateJwtToken(user);

    res.setHeader(
      'Set-Cookie', `Authentication=${token}; HttpOnly; Path=/;`
    );

    // update Login History
    this.userService.updateLoginById(user.id)

    return res.send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("logout")
  async logOut(@Req() req: Request, @Res() res: Response) {
    const user: any = req.user;
    this.userService.updateLoginById(user.id)
    res.setHeader('Set-Cookie',
      `Authentication=; HttpOnly; Path=/; Max-Age=0`);
    return res.sendStatus(200);
  }

  @Post('signIn')
  async create(@Body() createUserDto: CreateUserDto) {
    const saveUser = await this.userService.save(createUserDto);
    console.log("유저 생성 성공!", saveUser.name, saveUser.email);
    try {
      await this.mailService.sendVerificationMail(createUserDto.email, saveUser.uuid);
    } catch (error) {
      console.log("!! 유저 생성 실패 !!")
      await this.userService.remove(saveUser.uuid);
      console.log("잘못 생성된 유저 정보를 DB에서 삭제합니다.");
      throw new BadRequestException(Message.FAIL_VERIFICATION_EMAIL_SEND);
    }
    return saveUser;
  }

  @Put("activate/:uuid")
  activateUser(@Param('uuid') uuid: string) {
    return this.userService.updateUserStatus(uuid, UserStatus.activated);
  }

  @Put('updatePW')
  @UseGuards(JwtAuthGuard)
  async updatePW(@Req() req: Request, @Body() body) {
    const user: any = req.user;
    const pw = body["password"];
    await this.userService.updatePWByID(user.id, pw);
  }

  @Get('myInfo')
  @UseGuards(JwtAuthGuard)
  async getMyInfo(@Req() req: Request) {
    const user: any = req.user;
    const {password, cryptoSalt, ...UserInfo} = await this.userService.findOneById(user.id);

    return UserInfo
  }

  @Get('myReservation')
  @UseGuards(JwtAuthGuard)
  async getMyReservation(@Req() req: Request) {
    const user: any = req.user;
    const existUser = await this.userService.findOneById(user.id);
    const {...UserInfo} = await this.reservePlaceService.findAllByUser(existUser.uuid);

    return existUser
  }
}
