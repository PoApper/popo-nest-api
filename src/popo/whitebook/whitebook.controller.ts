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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileBody } from 'src/file/file-body.decorator';
import { FileService } from '../../file/file.service';

@ApiTags('생활백서(Whitebook)')
@Controller('whitebook')
export class WhitebookController {
  constructor(
    private readonly whitebookService: WhitebookService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @FileBody('pdf_file')
  async create(@Body() dto: WhitebookDto) {
    if (dto.pdf_file) {
      const pdf_url = await this.fileService.uploadFile(
        // S3 용량을 줄이기 위해 파일 이름이 같으면 덮어쓰게 함
        `whitebook/${dto.title}.pdf`,
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
  @UseGuards(JwtAuthGuard)
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

  @Patch('click/:uuid')
  AddOneClickCount(@Param('uuid') uuid: string) {
    return this.whitebookService.addOneClickCount(uuid);
  }

  @Put(':uuid')
  @FileBody('pdf_file')
  async update(@Param('uuid') uuid: string, @Body() dto: WhitebookDto) {
    if (dto.pdf_file) {
      const pdf_url = await this.fileService.uploadFile(
        // S3 용량을 줄이기 위해 파일 이름이 같으면 덮어쓰게 함
        `whitebook/${dto.title}.pdf`,
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
  delete(@Param('uuid') uuid: string) {
    return this.whitebookService.delete(uuid);
  }
}
