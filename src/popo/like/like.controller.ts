import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LikeDto } from './like.dto';
import { LikeService } from './like.service';

@ApiTags('Like')
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: LikeDto })
  createCalendar(@Body() dto: LikeDto) {
    return this.likeService.save(dto);
  }

  @Get('count')
  async getLikeCount(@Query('notice_id') notice_id: string): Promise<number> {
    return (await this.likeService.findAllByNoticeId(notice_id)).length;
  }

  @Get('status')
  async getLikeStatus(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: string,
  ): Promise<boolean> {
    return this.likeService.findByUserIdAndNoticeId(user_id, notice_id)
      ? true
      : false;
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteCalendar(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: string,
  ) {
    if (!this.likeService.findByUserIdAndNoticeId(user_id, notice_id)) {
      throw new BadRequestException(
        '해당 게시글에 좋아요를 누른 기록이 없습니다.',
      );
    }
    return this.likeService.delete(user_id, notice_id);
  }
}
