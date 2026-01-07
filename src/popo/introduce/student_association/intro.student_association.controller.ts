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

import { IntroStudentAssociationService } from './intro.student_association.service';
import {
  CreateIntroStudentAssociationDto,
  StudentAssociationImageDto,
} from './intro.student_association.dto';
import { RolesGuard } from '../../../auth/authroization/roles.guard';
import { Roles } from '../../../auth/authroization/roles.decorator';
import { UserType } from '../../user/user.meta';
import { FileBody } from '../../../file/file-body.decorator';
import { FileService } from '../../../file/file.service';
import { Public } from '../../../common/public-guard.decorator';

@ApiTags('Introduce - Student_Association')
@Controller('introduce/student_association')
export class IntroStudentAssociationController {
  constructor(
    private readonly introStudentAssociationService: IntroStudentAssociationService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  create(
    @Body() createIntroStudentAssociationDto: CreateIntroStudentAssociationDto,
  ) {
    return this.introStudentAssociationService.save(
      createIntroStudentAssociationDto,
    );
  }

  @ApiCookieAuth()
  @Post('image/:uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  @FileBody('image')
  async uploadImage(
    @Param('uuid') uuid: string,
    @Body() dto: StudentAssociationImageDto,
  ) {
    const image_url = await this.fileService.uploadFile(
      `student_association/${uuid}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
      dto.image,
    );
    await this.introStudentAssociationService.updateImageUrl(uuid, image_url);
    return image_url;
  }

  @Public()
  @Get()
  get() {
    return this.introStudentAssociationService.find({ order: { name: 'ASC' } });
  }

  @Public()
  @Get('today')
  getTodayVisited() {
    return this.introStudentAssociationService.find({
      where: {
        updatedAt: Between(
          moment().startOf('day').toDate(),
          moment().endOf('day').toDate(),
        ),
      },
    });
  }

  @Public()
  @Get('name/:name')
  async getOneByName(@Param('name') name: string) {
    const introAssociation =
      await this.introStudentAssociationService.findOneByName(name);

    if (introAssociation) {
      await this.introStudentAssociationService.updateViewCount(
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
    return this.introStudentAssociationService.findOneByUuid(uuid);
  }

  @ApiCookieAuth()
  @Put(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  put(
    @Param('uuid') uuid: string,
    @Body() updateIntroStudentAssociationDto: CreateIntroStudentAssociationDto,
  ) {
    return this.introStudentAssociationService.update(
      uuid,
      updateIntroStudentAssociationDto,
    );
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin, UserType.association)
  delete(@Param('uuid') uuid: string) {
    return this.introStudentAssociationService.remove(uuid);
  }
}
