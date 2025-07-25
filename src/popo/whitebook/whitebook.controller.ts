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

@ApiCookieAuth()
@ApiTags('생활백서(Whitebook)')
@Controller('whitebook')
export class WhitebookController {
  constructor(
    private readonly whitebookService: WhitebookService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(UserType.admin)
  @UseGuards(RolesGuard)
  @FileBody('pdf_file')
  async create(@Body() dto: WhitebookDto) {
    if (dto.pdf_file) {
      const pdf_url = await this.fileService.uploadFile(
        `whitebook/${dto.title}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
        dto.pdf_file,
      );
      dto.link = pdf_url;
    }

    const dtoWithoutPdfFile: Omit<WhitebookDto, 'pdf_file'> = {
      title: dto.title,
      content: dto.content,
      link: dto.link,
      show_only_login: dto.show_only_login,
    };

    return this.whitebookService.save(dtoWithoutPdfFile);
  }

  @Public()
  @Get()
  getAll(@Query('orderBy') orderBy: string) {
    if (orderBy === 'click_count') {
      return this.whitebookService.findAll({ click_count: 'DESC' });
    } else if (orderBy === 'updatedAt') {
      return this.whitebookService.findAll({ updatedAt: 'DESC' });
    } else if (orderBy === 'createdAt') {
      return this.whitebookService.findAll({ createdAt: 'DESC' });
    } else {
      return this.whitebookService.findAll({ title: 'ASC' });
    }
  }

  @Get('with-login')
  getAllForLoginUser(@Query('orderBy') orderBy: string) {
    if (orderBy === 'click_count') {
      return this.whitebookService.findAll({ click_count: 'DESC' }, true);
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

  @Put(':uuid')
  @Roles(UserType.admin)
  @UseGuards(RolesGuard)
  @FileBody('pdf_file')
  async update(@Param('uuid') uuid: string, @Body() dto: WhitebookDto) {
    if (dto.pdf_file) {
      const pdf_url = await this.fileService.uploadFile(
        `whitebook/${dto.title}/${moment().format('YYYY-MM-DD/HH:mm:ss')}`,
        dto.pdf_file,
      );
      dto.link = pdf_url;
    }

    const dtoWithoutPdfFile: Omit<WhitebookDto, 'pdf_file'> = {
      title: dto.title,
      content: dto.content,
      link: dto.link,
      show_only_login: dto.show_only_login,
    };

    return this.whitebookService.update(uuid, dtoWithoutPdfFile);
  }

  @Delete(':uuid')
  @Roles(UserType.admin)
  @UseGuards(RolesGuard)
  delete(@Param('uuid') uuid: string) {
    return this.whitebookService.delete(uuid);
  }
}
