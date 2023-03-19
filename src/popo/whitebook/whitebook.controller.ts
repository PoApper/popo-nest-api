import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WhitebookService } from './whitebook.service';
import { WhitebookDto } from './whitebook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('생활백서(Whitebook)')
@Controller('whitebook')
@UseInterceptors(CacheInterceptor)
export class WhitebookController {
  constructor(private readonly whitebookService: WhitebookService) {}

  @Post()
  create(@Body() dto: WhitebookDto) {
    return this.whitebookService.save(dto);
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
  update(@Param('uuid') uuid: string, @Body() dto: WhitebookDto) {
    return this.whitebookService.update(uuid, dto);
  }

  @Delete(':uuid')
  delete(@Param('uuid') uuid: string) {
    return this.whitebookService.delete(uuid);
  }
}
