import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhitebookService } from './whitebook.service';
import { WhitebookDto } from './whitebook.dto';
import { FileBody } from 'src/file/file-body.decorator';
import { FileService } from '../../file/file.service';
import * as moment from 'moment';
import { ApiCookieAuth } from '@nestjs/swagger';
import { Public } from '../../common/public-guard.decorator';
import { UserType } from '../user/user.meta';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { Roles } from 'src/auth/authroization/roles.decorator';

@ApiTags('생활백서(Whitebook)')
@Controller('whitebook')
export class WhitebookController {
  constructor(
    private readonly whitebookService: WhitebookService,
    private readonly fileService: FileService,
  ) {}

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin)
  @UseGuards(RolesGuard)
  @FileBody('pdfFile')
  async create(@Body() dto: WhitebookDto) {
    if (dto.pdfFile) {
      const pdfUrl = await this.fileService.uploadFile(
        `whitebook/${dto.title}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
        dto.pdfFile,
      );
      dto.link = pdfUrl;
    }

    const dtoWithoutPdfFile: Omit<WhitebookDto, 'pdfFile'> = {
      title: dto.title,
      content: dto.content,
      link: dto.link,
      showOnlyLogin: dto.showOnlyLogin,
    };

    return this.whitebookService.save(dtoWithoutPdfFile);
  }

  @Public()
  @Get()
  getAll(@Query('orderBy') orderBy: string) {
    if (orderBy === 'clickCount') {
      return this.whitebookService.findAll({ clickCount: 'DESC' });
    } else if (orderBy === 'updatedAt') {
      return this.whitebookService.findAll({ updatedAt: 'DESC' });
    } else if (orderBy === 'createdAt') {
      return this.whitebookService.findAll({ createdAt: 'DESC' });
    } else {
      return this.whitebookService.findAll({ title: 'ASC' });
    }
  }

  @ApiCookieAuth()
  @Get('with-login')
  getAllForLoginUser(@Query('orderBy') orderBy: string) {
    if (orderBy === 'clickCount') {
      return this.whitebookService.findAll({ clickCount: 'DESC' }, true);
    } else if (orderBy === 'updatedAt') {
      return this.whitebookService.findAll({ updatedAt: 'DESC' }, true);
    } else if (orderBy === 'createdAt') {
      return this.whitebookService.findAll({ createdAt: 'DESC' }, true);
    } else {
      return this.whitebookService.findAll({ title: 'ASC' }, true);
    }
  }

  @Public()
  @Patch('click/:uuid')
  AddOneClickCount(@Param('uuid') uuid: string) {
    return this.whitebookService.addOneClickCount(uuid);
  }

  @ApiCookieAuth()
  @Put(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  @FileBody('pdfFile')
  async update(@Param('uuid') uuid: string, @Body() dto: WhitebookDto) {
    if (dto.pdfFile) {
      const pdfUrl = await this.fileService.uploadFile(
        `whitebook/${dto.title}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
        dto.pdfFile,
      );
      dto.link = pdfUrl;
    }

    const dtoWithoutPdfFile: Omit<WhitebookDto, 'pdfFile'> = {
      title: dto.title,
      content: dto.content,
      link: dto.link,
      showOnlyLogin: dto.showOnlyLogin,
    };

    return this.whitebookService.update(uuid, dtoWithoutPdfFile);
  }

  @ApiCookieAuth()
  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles(UserType.admin)
  delete(@Param('uuid') uuid: string) {
    return this.whitebookService.delete(uuid);
  }
}
