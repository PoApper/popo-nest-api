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
} from '@nestjs/common';
import { WhitebookService } from './whitebook.service';
import { WhitebookDto } from './whitebook.dto';

@ApiTags('Whitebook')
@Controller('whitebook')
export class WhitebookController {
  constructor(private readonly whitebookService: WhitebookService) {}

  @Post()
  create(@Body() dto: WhitebookDto) {
    return this.whitebookService.save(dto);
  }

  @Get()
  getAll() {
    return this.whitebookService.findAll({ updatedAt: 'DESC' });
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
