import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards} from '@nestjs/common';
import {UserService} from "./user.service";
import {CreateUserDto, UpdateUserDto} from "./user.dto";
import {UserType} from "./user.meta";
import {JwtAuthGuard} from '../../auth/guards/jwt-auth.guard'
import {Roles} from "../../auth/authroization/roles.decorator";
import {RolesGuard} from "../../auth/authroization/roles.guard";

const Message = {
  FAIL_VERIFICATION_EMAIL_SEND: "Fail to send verification email.",
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.save(dto);
  }

  @Get()
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAll() {
    return this.userService.find({order: {lastLoginAt: "DESC"}});
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('uuid') uuid: string) {
    return this.userService.findOne({uuid: uuid});
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  getOneById(@Param('id') id: string) {
    return this.userService.findOne({id: id});
  }

  @Get('email/:email')
  async getOneByEmail(@Param('email') email: string) {
    return this.userService.findOne({email: email});
  }

  @Get('userType/:userType')
  async getUsersByUserType(@Param('userType') userType: UserType) {
    return this.userService.find({where: {userType: userType}, order: {lastLoginAt: "DESC"}});
  }

  @Put(':uuid')
  @UseGuards(JwtAuthGuard)
  async put(@Param('uuid') uuid: string, @Body() dto: UpdateUserDto) {
    return await this.userService.update(uuid, dto);
  }

  @Delete(":uuid")
  @Roles(UserType.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('uuid') uuid: string) {
    return this.userService.remove(uuid);
  }
}
