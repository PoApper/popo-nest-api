import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NoticeLikeDto } from './noticeLike.dto';
import { NoticeLikeService } from './noticeLike.service';
import { NoticeLike } from './noticeLike.entity';
import { JwtPayload } from 'src/auth/strategies/jwt.payload';

const Message = {
  FAIL_LIKE_DELETION_NEVER_LIKED: 'There is no record of liking the post.',
};

@ApiTags('Notice Like')
@Controller('noticeLike')
export class NoticeLikeController {
  constructor(private readonly noticeLikeService: NoticeLikeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: NoticeLikeDto })
  async create(@Body() dto: NoticeLikeDto, @Req() req): Promise<NoticeLike> {
    const user = req.user as JwtPayload;

    if (user.uuid != dto.user_id) {
      throw new BadRequestException('User ID does not match.');
    }

    return this.noticeLikeService.save(dto);
  }

  @Get('count')
  countLikes(@Query('notice_id') notice_id: number): Promise<number> {
    return this.noticeLikeService.countLikes(notice_id);
  }

  @Get('status')
  async getStatus(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: number,
  ): Promise<boolean> {
    return (await this.noticeLikeService.findByUserIdAndNoticeId(
      user_id,
      notice_id,
    ))
      ? true
      : false;
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async delete(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: number,
  ) {
    const target = await this.noticeLikeService.findByUserIdAndNoticeId(
      user_id,
      notice_id,
    );

    if (!target) {
      throw new BadRequestException(Message.FAIL_LIKE_DELETION_NEVER_LIKED);
    }
    return this.noticeLikeService.delete(user_id, notice_id);
  }
}
