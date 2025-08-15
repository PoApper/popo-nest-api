import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Between } from 'typeorm';
import * as moment from 'moment';

import { IntroClubService } from './intro.club.service';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { UserType } from '../../user/user.meta';
import { ClubImageDto, CreateIntroClubDto } from './intro.club.dto';
import { ClubType } from './intro.club.meta';
import { FileService } from '../../../file/file.service';
import { FileBody } from '../../../file/file-body.decorator';
import { ApiCookieAuth } from '@nestjs/swagger';
import { Public } from '../../../common/public-guard.decorator';

@ApiTags('Introduce - Club')
@Controller('introduce/club')
export class IntroClubController {
  constructor(
    private readonly introClubService: IntroClubService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  post(@Body() createIntroClubDto: CreateIntroClubDto) {
    return this.introClubService.save(createIntroClubDto);
  }

  @ApiCookieAuth()
  @Post('image/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @FileBody('image')
  async uploadImage(@Param('uuid') uuid: string, @Body() dto: ClubImageDto) {
    const image_url = await this.fileService.uploadFile(
      `club/${uuid}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.introClubService.updateImageUrl(uuid, image_url);
    return image_url;
  }

  @Public()
  @Get()
  get() {
    return this.introClubService.find({ order: { name: 'ASC' } });
  }

  @Public()
  @Get('today')
  getTodayVisited() {
    return this.introClubService.find({
      where: {
        updatedAt: Between(
          moment().startOf('day').toDate(),
          moment().endOf('day').toDate(),
        ),
      },
    });
  }

  @Public()
  @Get('clubType/:clubType')
  getByClubType(@Param('clubType') clubType: ClubType) {
    return this.introClubService.find({
      where: { clubType: clubType },
      order: { name: 'ASC' },
    });
  }

  @Public()
  @Get('name/:name')
  async getOneByName(@Param('name') name: string) {
    const introClub = await this.introClubService.findOneByName(name);

    if (introClub) {
      await this.introClubService.updateViewCount(
        introClub.uuid,
        introClub.views + 1,
      );
      return introClub;
    } else {
      throw new BadRequestException('Not Exist');
    }
  }

  @Public()
  @Get(':uuid')
  getOneByUuid(@Param('uuid') uuid: string) {
    return this.introClubService.findOneByUuid(uuid);
  }

  @ApiCookieAuth()
  @Put(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  put(
    @Param('uuid') uuid: string,
    @Body() updateIntroClubDto: CreateIntroClubDto,
  ) {
    return this.introClubService.update(uuid, updateIntroClubDto);
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  delete(@Param('uuid') uuid: string) {
    return this.introClubService.remove(uuid);
  }
}
