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
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Between } from 'typeorm';
import * as moment from 'moment';

import { IntroAssociationService } from './intro.association.service';
import { CreateIntroAssociationDto } from './intro.association.dto';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { UserType } from '../../user/user.meta';
import { FileBody } from '../../../file/file-body.decorator';
import { ClubImageDto } from '../club/intro.club.dto';
import { FileService } from '../../../file/file.service';
import { Public } from '../../../common/public-guard.decorator';
import { AssociationType } from './intro.association.meta';

@ApiTags('Introduce - Association')
@Controller('introduce/association')
export class IntroAssociationController {
  constructor(
    private readonly introAssociationService: IntroAssociationService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  create(@Body() createIntroAssociationDto: CreateIntroAssociationDto) {
    return this.introAssociationService.save(createIntroAssociationDto);
  }

  @ApiCookieAuth()
  @Post('image/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @FileBody('image')
  async uploadImage(@Param('uuid') uuid: string, @Body() dto: ClubImageDto) {
    const image_url = await this.fileService.uploadFile(
      `association/${uuid}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.introAssociationService.updateImageUrl(uuid, image_url);
    return image_url;
  }

  @Public()
  @Get()
  get() {
    return this.introAssociationService.find({ order: { name: 'ASC' } });
  }

  @Public()
  @Get('types')
  getAssociationTypes() {
    return Object.entries(AssociationType).map(([key, value]) => ({
      key,
      value,
    }));
  }

  @Public()
  @Get('today')
  getTodayVisited() {
    return this.introAssociationService.find({
      where: {
        updatedAt: Between(
          moment().startOf('day').toDate(),
          moment().endOf('day').toDate(),
        ),
      },
    });
  }

  @Public()
  @Get('associationType/:associationType')
  getByAssociationType(
    @Param('associationType') associationType: AssociationType,
  ) {
    return this.introAssociationService.find({
      where: { associationType: associationType },
      order: { name: 'ASC' },
    });
  }

  @Public()
  @Get('name/:name')
  async getOneByName(@Param('name') name: string) {
    const introAssociation =
      await this.introAssociationService.findOneByName(name);

    if (introAssociation) {
      await this.introAssociationService.updateViewCount(
        introAssociation.uuid,
        introAssociation.views + 1,
      );
      return introAssociation;
    } else {
      throw new BadRequestException('Not Exist');
    }
  }

  @Public()
  @Get(':uuid')
  getOneByUuid(@Param('uuid') uuid: string) {
    return this.introAssociationService.findOneByUuid(uuid);
  }

  @ApiCookieAuth()
  @Put(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  put(
    @Param('uuid') uuid: string,
    @Body() updateIntroAssociationDto: CreateIntroAssociationDto,
  ) {
    return this.introAssociationService.update(uuid, updateIntroAssociationDto);
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  delete(@Param('uuid') uuid: string) {
    return this.introAssociationService.remove(uuid);
  }
}
