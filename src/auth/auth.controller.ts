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
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserStatus, UserType } from '../popo/user/user.meta';
import { UserService } from '../popo/user/user.service';
import { CreateUserDto } from '../popo/user/user.dto';
import { MailService } from '../mail/mail.service';
import { ReservePlaceService } from '../popo/reservation/place/reserve.place.service';
import { ReserveEquipService } from '../popo/reservation/equip/reserve.equip.service';
import { PasswordChangeDto, PasswordChangeRequestDto } from './auth.dto';
import { encryptWord } from '../utils/encrypt-utils';

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
    const user: any = req.user;
    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException();
      }
    }
    this.userService.updateLoginById(user.id);
    return user;
  }

  @Get('me/reservation')
  @UseGuards(JwtAuthGuard)
  async getOwnReservations(@Req() req) {
    const user = req.user;
    const existUser = await this.userService.findOne({ id: user.id });

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
    const user: any = req.user;

    if (path.includes('admin')) {
      if (!requiredRoles.some((role) => user.userType?.includes(role))) {
        throw new UnauthorizedException('Not authorized account.');
      }
    }
    const token = await this.authService.generateJwtToken(user);

    res.setHeader('Set-Cookie', `Authentication=${token}; HttpOnly; Path=/;`);

    // update Login History
    this.userService.updateLoginById(user.id);

    return res.send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logOut(@Req() req: Request, @Res() res: Response) {
    const user: any = req.user;
    this.userService.updateLoginById(user.id);
    res.setHeader('Set-Cookie', `Authentication=; HttpOnly; Path=/; Max-Age=0`);
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
      console.log('!! 유저 생성 실패 !!');
      await this.userService.remove(saveUser.uuid);
      console.log('잘못 생성된 유저 정보를 DB에서 삭제합니다.');
      throw new BadRequestException(Message.FAIL_VERIFICATION_EMAIL_SEND);
    }
    return saveUser;
  }

  @Put('activate/:uuid')
  activateUser(@Param('uuid') uuid: string) {
    return this.userService.updateUserStatus(uuid, UserStatus.activated);
  }

  @Put('updatePW')
  @UseGuards(JwtAuthGuard)
  async updatePW(@Req() req: Request, @Body() body) {
    const user: any = req.user;
    const password = body['password'];
    await this.userService.updatePWByID(user.id, password);
  }

  @Get('myInfo')
  @UseGuards(JwtAuthGuard)
  async getMyInfo(@Req() req: Request) {
    const user: any = req.user;
    return this.userService.findOneByUuidWithInfo(user.id);
  }

  @Post('request-password-change')
  async sendPasswordChangeLink(@Body() dto: PasswordChangeRequestDto) {
    const targetUser = await this.userService.findOneByEmail(dto.email);
    if (!targetUser) {
      throw new BadRequestException('No User for given email');
    }

    // Update Password Change Request Event
    await this.userService.updatePasswordChangeRequestEventById(targetUser.id);

    // Generate User Token
    const userToken = encryptWord(
      targetUser.uuid,
      targetUser.cryptoSalt,
      100,
      12,
    );

    // Send Password Change Email
    await this.mailService.sendPasswordChangeMail(dto.email, userToken);
  }

  @Post('change-password')
  async changePassword(@Body() dto: PasswordChangeDto) {
    // Check Password Change Request is expired
  }
}
