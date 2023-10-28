import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { AffiliateService } from './affiliate.service';
import { AffilateDto } from './affiliate.dto';

@ApiTags('Benefit/Affilate')
@Controller('benefit/affilate')
export class AffilateController {
  constructor(private readonly affilateService: AffiliateService) {}

  @Post()
  @ApiBody({ type: AffilateDto })
  createAffilate(@Body() dto: AffilateDto) {
    return this.affilateService.save(dto);
  }

  @Get()
  getAllAffilates() {
    return this.affilateService.findAll();
  }

  @Get(':id')
  getAffilateByUuid(@Param('id') id: number) {
    return this.affilateService.findById(id);
  }

  @Put(':id')
  @ApiBody({ type: AffilateDto })
  updateAffilate(@Param('id') id: number, @Body() dto: AffilateDto) {
    return this.affilateService.update(id, dto);
  }

  @Delete(':id')
  deleteAffilate(@Param('id') id: number) {
    return this.affilateService.delete(id);
  }
}
