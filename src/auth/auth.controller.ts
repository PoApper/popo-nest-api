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
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserStatus, UserType } from '../popo/user/user.meta';
import { UserService } from '../popo/user/user.service';
import { CreateUserDto } from '../popo/user/user.dto';
import { MailService } from '../mail/mail.service';
import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { ReserveEquipService } from '../popo/reservation/equip/reserve.equip.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayload } from './strategies/jwt.payload';
import { PasswordResetRequest, PasswordUpdateRequest } from './auth.dto';
const requiredRoles = [UserType.admin, UserType.association, UserType.staff];

const Message = {
  FAIL_VERIFICATION_EMAIL_SEND: 'Fail to send verification email.',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly reservePlaceService: ReservePlaceService,
    private readonly reserveEquipService: ReserveEquipService,
    private readonly mailService: MailService,
  ) {}

  @Get(['verifyToken', 'verifyToken/admin', 'me'])
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: Request) {
    const path = req.path;
    const user = req.user as JwtPayload;
    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException();
      }
    }
    this.userService.updateLogin(user.uuid);
    return user;
  }

  @Get('me/reservation')
  @UseGuards(JwtAuthGuard)
  async getOwnReservations(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const existUser = await this.userService.findOneByEmail(user.email);

    const existPlaceReserve = await this.reservePlaceService.find({
      where: { user: existUser.uuid },
      order: { createdAt: 'DESC' },
    });
    const existEquipReserve = await this.reserveEquipService.find({
      where: { user: existUser.uuid },
      order: { createdAt: 'DESC' },
    });

    return {
      place_reservation: existPlaceReserve,
      equip_reservation: existEquipReserve,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post(['login', 'login/admin'])
  async logIn(@Req() req: Request, @Res() res: Response) {
    const path = req.path;
    const user = req.user as JwtPayload;

    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException('Not authorized account.');
      }
    }
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/', // 모든 경로에서 접근 가능하도록
      domain:
        process.env.NODE_ENV === 'local' ? 'localhost' : 'popo.poapper.club',
      sameSite: 'lax', // 또는 'strict', 필요에 따라 'none' (none 사용 시 Secure 필수)
      maxAge: 1000 * 60 * 60 * 24 * 5, // 5일
    });

    // 2. 리프레시 토큰 쿠키 설정
    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true, // 운영 환경에서만 true
      path: '/auth/refresh', // 리프레시 토큰은 특정 경로에서만 사용, /auth/refresh는 로그아웃 시 사용 안되는지 확인
      domain:
        process.env.NODE_ENV === 'local' ? 'localhost' : 'popo.poapper.club',
      sameSite: 'lax', // 또는 'strict', 필요에 따라 'none'
      maxAge: 1000 * 60 * 60 * 24 * 60, // 60일
    });

    // update Login History
    const existUser = await this.userService.findOneByUuidOrFail(user.uuid);
    await this.userService.updateLogin(existUser.uuid);

    return res.send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logOut(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JwtPayload;
    this.userService.updateLogin(user.uuid);
    // res.setHeader('Set-Cookie', `Authentication=; HttpOnly; Path=/; Max-Age=0`);
    await this.userService.updateRefreshToken(user.uuid, null, null);
    // res.setHeader(
    //   'Set-Cookie',
    //   `Refresh=; HttpOnly; Path=/auth/refresh; Max-Age=0`,
    // );
    res.clearCookie('Authentication');
    res.clearCookie('Refresh', {
      path: '/auth/refresh',
    });

    return res.sendStatus(200);
  }

  @Post(['signIn', 'register'])
  async register(@Body() createUserDto: CreateUserDto) {
    const saveUser = await this.userService.save(createUserDto);
    console.log('유저 생성 성공!', saveUser.name, saveUser.email);

    try {
      await this.mailService.sendVerificationMail(
        createUserDto.email,
        saveUser.uuid,
      );
    } catch (error) {
      console.log('!! 유저 인증 메일 전송 실패 !!');
      await this.userService.remove(saveUser.uuid);
      console.log('잘못 생성된 유저 정보를 DB에서 삭제합니다.');
      throw new BadRequestException(Message.FAIL_VERIFICATION_EMAIL_SEND);
    }
    return saveUser;
  }

  @Put('activate/:user_uuid')
  activateUser(@Param('user_uuid') user_uuid: string) {
    return this.userService.updateUserStatus(user_uuid, UserStatus.activated);
  }

  @Post('password/reset')
  async resetPassword(@Body() body: PasswordResetRequest) {
    const existUser = await this.userService.findOneByEmail(body.email);

    if (!existUser) {
      throw new BadRequestException(
        '해당 이메일로 가입한 유저가 존재하지 않습니다.',
      );
    }

    if (existUser.userStatus === UserStatus.password_reset) {
      throw new BadRequestException(
        '이미 비빌번호를 초기화 했습니다. 신규 비밀번호를 메일에서 확인해주세요.',
      );
    }

    // generate 8-length random password
    const temp_password = 'poapper_' + Math.random().toString(36).slice(-8);

    await this.userService.updatePasswordByEmail(
      existUser.email,
      temp_password,
    );
    await this.userService.updateUserStatus(
      existUser.uuid,
      UserStatus.password_reset,
    );
    await this.mailService.sendPasswordResetMail(
      existUser.email,
      temp_password,
    );
  }

  @Post('password/update')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Req() req: Request,
    @Body() body: PasswordUpdateRequest,
  ) {
    const user = req.user as JwtPayload;
    return this.userService.updatePasswordByEmail(user.email, body.password);
  }

  @Get('myInfo')
  @UseGuards(JwtAuthGuard)
  async getMyInfo(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const { ...UserInfo } = await this.userService.findOneByUuid(user.uuid);

    return UserInfo;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JwtPayload;

    const refreshTokenInCookie = req.cookies?.Refresh;
    const isValid = await this.authService.validateRefreshToken(
      user,
      refreshTokenInCookie,
    );
    if (!isValid) {
      await this.userService.updateRefreshToken(user.uuid, null, null);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain:
        process.env.NODE_ENV === 'local' ? 'localhost' : 'popo.poapper.club',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 5, // 5일, TODO: 환경변수로 변경
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain:
        process.env.NODE_ENV === 'local' ? 'localhost' : 'popo.poapper.club',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 60, // 60일
    });

    return res.send(user);
  }
}
