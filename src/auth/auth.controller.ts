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
import { UserStatus, UserType } from '../popo/user/user.meta';
import { UserService } from '../popo/user/user.service';
import { CreateUserDto } from '../popo/user/user.dto';
import { MailService } from '../mail/mail.service';
import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { ReserveEquipService } from '../popo/reservation/equip/reserve.equip.service';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from './strategies/jwt.payload';
import { PasswordResetRequest, PasswordUpdateRequest } from './auth.dto';
import { jwtConstants } from './constants';
import * as ms from 'ms';
import * as crypto from 'crypto';
import { Public } from '../common/public-guard.decorator';
import { User } from 'src/popo/common/user.decorator';

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

  @ApiCookieAuth()
  @Get(['verifyToken', 'verifyToken/admin', 'me'])
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

  @ApiCookieAuth()
  @Get('me/reservation')
  async getOwnReservations(@User() user: JwtPayload) {
    const existPlaceReserve = await this.reservePlaceService.find({
      where: { bookerId: user.uuid },
      order: { createdAt: 'DESC' },
    });
    const existEquipReserve = await this.reserveEquipService.find({
      where: { bookerId: user.uuid },
      order: { createdAt: 'DESC' },
    });

    return {
      place_reservation: existPlaceReserve,
      equip_reservation: existEquipReserve,
    };
  }

  @Public()
  @Post(['login', 'login/admin'])
  @UseGuards(LocalAuthGuard)
  async logIn(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
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

    return user;
  }

  @ApiCookieAuth()
  @Get('logout')
  async logOut(
    @User() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.userService.updateLogin(user.uuid);
    await this.userService.updateRefreshToken(user.uuid, null, null);

    this.clearCookies(res);

    return { message: 'Successfully logged out' };
  }

  @Public()
  @Post(['signIn', 'register'])
  async register(@Body() createUserDto: CreateUserDto) {
    const saveUser = await this.userService.save(createUserDto);
    console.log('유저 생성 성공!', saveUser.name, saveUser.email); // TODO: console.log 로깅으로 변경

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

  // 생성한 계정을 활성화하기 위한 이메일의 링크에서 호출
  @Public()
  @Put('activate/:user_uuid')
  activateUser(@Param('user_uuid') user_uuid: string) {
    return this.userService.updateUserStatus(user_uuid, UserStatus.activated);
  }

  @Public()
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

    const temp_password = this.generateSecurePassword(12);

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

  @ApiCookieAuth()
  @Post('password/update')
  async updatePassword(
    @User() user: JwtPayload,
    @Body() body: PasswordUpdateRequest,
  ) {
    return this.userService.updatePasswordByEmail(user.email, body.password);
  }

  @ApiCookieAuth()
  @Get('myInfo')
  async getMyInfo(@User() user: JwtPayload) {
    const { ...UserInfo } = await this.userService.findOneByUuid(user.uuid);

    return UserInfo;
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary:
      'Swagger에서 테스트 불가능: 리프레시 토큰을 사용해 엑세스 토큰 갱신',
    description:
      '해당 엔드포인트를 테스트하려면 Authentication, Refresh 두 가지 토큰이 필요한데, Swagger에서는 최대 하나의 토큰만 등록 가능합니다. 테스트하려면 Postman같은 툴을 사용하거나 개발자도구로 Refresh 쿠키를 직접 넣어야 합니다.',
  })
  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
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

    return user;
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

  private generateSecurePassword(length: number): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + specialChars;

    let password = 'poapper_';

    // Ensure at least one character from each category
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += specialChars[crypto.randomInt(0, specialChars.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    return password;
  }
}
