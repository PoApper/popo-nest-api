import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PasswordChangeService } from './password-change.service';
import { PasswordChangeRequestStatus } from './password-change-request.type';
import { MailService } from '../../mail/mail.service';
import { UserService } from '../../popo/user/user.service';
import {
  PasswordChangeDto,
  PasswordChangeRequestDto,
} from './password-change.dto';

@ApiTags('Password-Change')
@Controller('password-change')
export class PasswordChangeController {
  constructor(
    private readonly userService: UserService,
    private readonly pwChangeService: PasswordChangeService,
    private readonly mailService: MailService,
  ) {}

  @Post('request')
  @ApiBody({ type: PasswordChangeRequestDto })
  async sendPasswordChangeLink(@Body() dto: PasswordChangeRequestDto) {
    const targetUser = await this.userService.findOneByEmail(dto.email);
    if (!targetUser) {
      throw new BadRequestException('No User for given email');
    }

    // Generate Password Change Request Event
    const pwChangeReq = await this.pwChangeService.createPasswordChangeRequest(
      targetUser.uuid,
    );

    // Send Password Change Email
    await this.mailService.sendPasswordChangeMail(dto.email, pwChangeReq.uuid);
  }

  @Get('auth')
  async authenticatePasswordChange(
    @Query('uuid') request_uuid: string,
    @Res() res,
  ) {
    await this.pwChangeService.updatePasswordChangeRequestStatus(
      request_uuid,
      PasswordChangeRequestStatus.AUTHENTICATED,
    );

    const redirectUrl = `https://popo.poapper.club/auth/change-password?uuid=${request_uuid}`;

    return res.redirect(redirectUrl);
  }

  @Post('change-password')
  @ApiBody({ type: PasswordChangeDto })
  async changePassword(@Body() dto: PasswordChangeDto) {
    const pwChangeRequest =
      await this.pwChangeService.findPasswordChangeRequest(
        dto.change_request_uuid,
      );
    if (!pwChangeRequest) {
      throw new BadRequestException('Invalid Password Change Request UUID');
    }

    // Check Password Change Request is expired
    const now = new Date();
    const diffSeconds = Math.floor(
      (Number(now) - Number(pwChangeRequest.created_at)) / 1000,
    );
    const TIMEOUT_SECONDS = 10 * 60;
    if (diffSeconds > TIMEOUT_SECONDS) {
      throw new BadRequestException('Password Changed Request is expired!');
    }

    // Change Password
    await this.userService.updatePasswordByUuid(
      pwChangeRequest.user_uuid,
      dto.new_password,
    );

    // Complete Request Status
    await this.pwChangeService.updatePasswordChangeRequestStatus(
      dto.change_request_uuid,
      PasswordChangeRequestStatus.COMPLETED,
    );
  }

  @Delete(':uuid')
  deleteUser(@Param('uuid') uuid: string) {
    return this.pwChangeService.delete(uuid);
  }
}
