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
import { jwtConstants } from './constants';
import * as ms from 'ms';
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

    this.setCookies(res, accessToken, refreshToken);

    // update Login History
    const existUser = await this.userService.findOneByUuidOrFail(user.uuid);
    await this.userService.updateLogin(existUser.uuid);

    return res.send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logOut(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JwtPayload;
    await this.userService.updateLogin(user.uuid);
    await this.userService.updateRefreshToken(user.uuid, null, null);

    this.clearCookies(res);

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
  async refresh(@Req() req: Request, @Res() res: Response) {
    const accessTokenInCookie = req.cookies?.Authentication;
    const refreshTokenInCookie = req.cookies?.Refresh;

    if (!accessTokenInCookie || !refreshTokenInCookie) {
      this.clearCookies(res);
      throw new UnauthorizedException('Missing access token or refresh token');
    }

    // 만료된 access token을 디코딩 (JWT 가드 우회)
    const user = this.authService.decodeExpiredAccessToken(accessTokenInCookie);
    if (!user) {
      this.clearCookies(res);
      throw new UnauthorizedException('Invalid access token');
    }

    // refresh token 검증
    const isValid = await this.authService.validateRefreshToken(
      user,
      refreshTokenInCookie,
    );
    if (!isValid) {
      await this.userService.updateRefreshToken(user.uuid, null, null);
      this.clearCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    this.setCookies(res, accessToken, refreshToken);

    return res.send(user);
  }

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const domain =
      process.env.NODE_ENV === 'prod'
        ? 'popo.poapper.club'
        : process.env.NODE_ENV === 'dev'
          ? 'popo-dev.poapper.club'
          : 'localhost';

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(jwtConstants.refreshTokenExpirationTime),
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
      maxAge: ms(jwtConstants.refreshTokenExpirationTime),
    });
  }

  private clearCookies(res: Response): void {
    const domain =
      process.env.NODE_ENV === 'prod'
        ? 'popo.poapper.club'
        : process.env.NODE_ENV === 'dev'
          ? 'popo-dev.poapper.club'
          : 'localhost';

    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/',
      domain: domain,
      sameSite: 'lax',
    });

    res.clearCookie('Refresh', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'local' ? false : true,
      path: '/auth/refresh',
      domain: domain,
      sameSite: 'lax',
    });
  }
}
