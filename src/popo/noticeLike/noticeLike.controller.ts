import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { NoticeLikeDto } from './noticeLike.dto';
import { NoticeLikeService } from './noticeLike.service';
import { NoticeLike } from './noticeLike.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';
import { User } from 'src/popo/common/user.decorator';

const Message = {
  FAIL_LIKE_DELETION_NEVER_LIKED: 'There is no record of liking the post.',
};

@ApiTags('Notice Like: 사용하지 않는 API')
@Controller('noticeLike')
export class NoticeLikeController {
  constructor(private readonly noticeLikeService: NoticeLikeService) {}

  @ApiCookieAuth()
  @Post()
  @ApiBody({ type: NoticeLikeDto })
  async create(
    @Body() dto: NoticeLikeDto,
    @User() user: JwtPayload,
  ): Promise<NoticeLike> {
    if (user.uuid != dto.userId) {
      throw new BadRequestException('User ID does not match.');
    }

    return this.noticeLikeService.save(dto);
  }

  @Get('count/:noticeId')
  countLikes(@Param('noticeId') noticeId: number): Promise<number> {
    return this.noticeLikeService.countLikes(noticeId);
  }

  @ApiCookieAuth()
  @Get('status/:userId/:noticeId')
  async getStatus(
    @Param('userId') userId: string,
    @Param('noticeId') noticeId: number,
  ): Promise<boolean> {
    if (!userId || !noticeId) {
      return false;
    }
    return (await this.noticeLikeService.findByUserIdAndNoticeId(
      userId,
      noticeId,
    ))
      ? true
      : false;
  }

  @ApiCookieAuth()
  @Delete(':userId/:noticeId')
  async delete(
    @Param('userId') userId: string,
    @Param('noticeId') noticeId: number,
    @User() user: JwtPayload,
  ) {
    if (user.uuid != userId) {
      throw new BadRequestException('User ID does not match.');
    }

    const target = await this.noticeLikeService.findByUserIdAndNoticeId(
      userId,
      noticeId,
    );

    if (!target) {
      throw new BadRequestException(Message.FAIL_LIKE_DELETION_NEVER_LIKED);
    }
    return this.noticeLikeService.delete(userId, noticeId);
  }
}
