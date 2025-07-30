import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { CreateUserDto, UpdatePasswordDto, UpdateUserDto } from './user.dto';
import { UserType } from './user.meta';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../auth/strategies/jwt.payload';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.save(dto);
  }

  @Get()
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getAll(
    @Query('type') type: string,
    @Query('status') status: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
  ) {
    const whereOption = {};
    if (type) {
      whereOption['userType'] = type;
    }
    if (status) {
      whereOption['userStatus'] = status;
    }

    const findOption = { where: whereOption, order: { lastLoginAt: 'DESC' } };
    if (skip) {
      findOption['skip'] = skip;
    }
    if (take) {
      findOption['take'] = take;
    }

    return this.userService.find(findOption);
  }

  @Get('count/:userType')
  countByUserType(@Param('userType') userType: UserType) {
    return this.userService.count({ userType: userType });
  }

  @Get('count')
  countAll() {
    return this.userService.count();
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('uuid') uuid: string) {
    return this.userService.findOneByUuid(uuid);
  }

  @Get('admin/:uuid')
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getOneByAdmin(@Param('uuid') uuid: string) {
    return this.userService.findOneByUuid(uuid);
  }

  @Get('email/:email')
  async getOneByEmail(@Param('email') email: string) {
    return this.userService.findOneByEmail(email);
  }

  @Get('userType/:userType')
  async getUsersByUserType(@Param('userType') userType: UserType) {
    return this.userService.find({
      where: { userType: userType },
      order: { lastLoginAt: 'DESC' },
    });
  }

  @Put(':uuid')
  @UseGuards(JwtAuthGuard)
  async put(@Param('uuid') uuid: string, @Body() dto: UpdateUserDto) {
    return await this.userService.update(uuid, dto);
  }

  // only uuid format is allowed for security!
  @Put('password/:uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.admin)
  async updatePassword(
    @Param('uuid') uuid: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return await this.userService.updatePasswordByUuid(uuid, dto.password);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMyAccount(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JwtPayload;
    await this.userService.updateRefreshToken(user.uuid, null, null);

    this.clearCookies(res);

    await this.userService.remove(user.uuid);
    return res.sendStatus(204);
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

  @Delete(':uuid')
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('uuid') uuid: string) {
    return this.userService.remove(uuid);
  }
}
