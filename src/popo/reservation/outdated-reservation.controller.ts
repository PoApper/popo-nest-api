import { Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { OutdatedReservationService } from './outdated-reservation.service';
import { Roles } from '../../auth/authroization/roles.decorator';
import { RolesGuard } from '../../auth/authroization/roles.guard';
import { UserType } from '../user/user.meta';
import { JwtPayload } from '../../auth/strategies/jwt.payload';
import { User } from '../common/user.decorator';

@ApiTags('Reservation - Outdated')
@Controller('reservation/outdated')
export class OutdatedReservationController {
  private readonly logger = new Logger(OutdatedReservationController.name);

  constructor(
    private readonly outdatedReservationService: OutdatedReservationService,
  ) {}

  @ApiCookieAuth()
  @ApiOperation({
    summary: '지난 예약 일괄 자동 승인',
    description:
      '종료된 지 오래된 "심사중" 예약을 승인 처리합니다. 메일은 보내지 않습니다. ' +
      '한 번 호출에 처리 한도가 있으므로, 응답의 mayHaveMore 가 true 면 다시 호출해주세요.',
  })
  @Post('accept')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  async acceptOutdated(@User() user: JwtPayload) {
    const summary =
      await this.outdatedReservationService.acceptOutdatedReservations();

    this.logger.log(
      [
        '[지난 예약 수동 자동승인]',
        `- 관리자 UUID: ${user?.uuid}`,
        `- 관리자 이름: ${user?.name ?? '(이름 없음)'}`,
        `- 기준 시각: ${summary.cutoff} 이전 종료`,
        `- 장소 예약: ${summary.placeAcceptedCount}건`,
        `- 장비 예약: ${summary.equipAcceptedCount}건`,
        `- 남은 건 있을 수 있음: ${summary.mayHaveMore}`,
      ].join('\n'),
    );

    return summary;
  }
}
