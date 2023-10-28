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
import { AffiliateDto } from './affiliate.dto';

@ApiTags('Benefit/Affiliate')
@Controller('benefit/affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post()
  @ApiBody({ type: AffiliateDto })
  createAffiliate(@Body() dto: AffiliateDto) {
    return this.affiliateService.save(dto);
  }

  @Get()
  getAllAffiliates() {
    return this.affiliateService.findAll();
  }

  @Get(':id')
  getAffiliateByUuid(@Param('id') id: number) {
    return this.affiliateService.findById(id);
  }

  @Put(':id')
  @ApiBody({ type: AffiliateDto })
  updateAffiliate(@Param('id') id: number, @Body() dto: AffiliateDto) {
    return this.affiliateService.update(id, dto);
  }

  @Delete(':id')
  deleteAffiliate(@Param('id') id: number) {
    return this.affiliateService.delete(id);
  }
}
