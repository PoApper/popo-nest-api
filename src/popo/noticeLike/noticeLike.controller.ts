import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

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
  async create(
    @Body() dto: NoticeLikeDto,
    @Req() req: Request,
  ): Promise<NoticeLike> {
    const user = req.user as JwtPayload;

    if (user.uuid != dto.user_id) {
      throw new BadRequestException('User ID does not match.');
    }

    return this.noticeLikeService.save(dto);
  }

  @Get('count/:notice_id')
  countLikes(@Param('notice_id') notice_id: number): Promise<number> {
    return this.noticeLikeService.countLikes(notice_id);
  }

  @Get('status/:user_id/:notice_id')
  async getStatus(
    @Param('user_id') user_id: string,
    @Param('notice_id') notice_id: number,
  ): Promise<boolean> {
    if (!user_id || !notice_id) {
      return false;
    }
    return (await this.noticeLikeService.findByUserIdAndNoticeId(
      user_id,
      notice_id,
    ))
      ? true
      : false;
  }

  @Delete(':user_id/:notice_id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('user_id') user_id: string,
    @Param('notice_id') notice_id: number,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload;
    if (user.uuid != user_id) {
      throw new BadRequestException('User ID does not match.');
    }

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
