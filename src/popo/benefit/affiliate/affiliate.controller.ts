import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { AffiliateService } from './affiliate.service';
import { AffiliateDto } from './affiliate.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { Public } from 'src/common/public-guard.decorator';

@ApiTags('Benefit - Affiliate')
@Controller('benefit/affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @ApiCookieAuth()
  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @ApiBody({ type: AffiliateDto })
  createAffiliate(@Body() dto: AffiliateDto) {
    return this.affiliateService.save(dto);
  }

  @Public()
  @Get()
  getAllAffiliates() {
    return this.affiliateService.findAll();
  }

  @Public()
  @Get(':id')
  getAffiliateByUuid(@Param('id') id: number) {
    return this.affiliateService.findById(id);
  }

  @ApiCookieAuth()
  @Put(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  @ApiBody({ type: AffiliateDto })
  updateAffiliate(@Param('id') id: number, @Body() dto: AffiliateDto) {
    return this.affiliateService.update(id, dto);
  }

  @ApiCookieAuth()
  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(RolesGuard)
  deleteAffiliate(@Param('id') id: number) {
    return this.affiliateService.delete(id);
  }
}
