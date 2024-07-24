import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NoticeLikeDto } from './noticeLike.dto';
import { NoticeLikeService } from './noticeLike.service';
import { QueryFailedError } from 'typeorm';
import { NoticeLike } from './noticeLike.entity';

const Message = {
  FAIL_LIKE_DELETION_NEVER_LIKED: 'There is no record of liking the post.',
  FAIL_DUPLICATE_ENTRY: 'Duplicate entry detected',
  FAIL_INTERNAL_SERVER: 'Internal server error',
};

@ApiTags('Notice Like')
@Controller('noticeLike')
export class NoticeLikeController {
  constructor(private readonly noticeLikeService: NoticeLikeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: NoticeLikeDto })
  async create(@Body() dto: NoticeLikeDto): Promise<NoticeLike> {
    try {
      return await this.noticeLikeService.save(dto);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new HttpException(
          Message.FAIL_DUPLICATE_ENTRY,
          HttpStatus.CONFLICT,
        );
      } else {
        throw new HttpException(
          Message.FAIL_INTERNAL_SERVER,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get('count')
  countLikes(@Query('notice_id') notice_id: string): Promise<number> {
    return this.noticeLikeService.countLikes(notice_id);
  }

  @Get('status')
  async getStatus(
    @Query('user_id') user_id: string,
    @Query('notice_id') notice_id: string,
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
    @Query('notice_id') notice_id: string,
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
