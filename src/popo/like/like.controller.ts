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

const Message = {
  FAIL_LIKE_DELETION_NEVER_LIKED: 'There is no record of liking the post.',
};

@ApiTags('Like')
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: LikeDto })
  async create(@Body() dto: LikeDto): Promise<LikeDto> {
    return this.likeService.save(dto);
  }

  @Get('count')
  countLikes(@Query('notice_id') notice_id: string): Promise<number> {
    return this.likeService.countLikes(notice_id);
  }

  @Get('status')
  getStatus(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: string,
  ): boolean {
    return this.likeService.findByUserIdAndNoticeId(user_id, notice_id)
      ? true
      : false;
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async delete(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: string,
  ) {
    const target = await this.likeService.findByUserIdAndNoticeId(
      user_id,
      notice_id,
    );

    if (!target) {
      throw new BadRequestException(Message.FAIL_LIKE_DELETION_NEVER_LIKED);
    }
    return this.likeService.delete(user_id, notice_id);
  }
}
