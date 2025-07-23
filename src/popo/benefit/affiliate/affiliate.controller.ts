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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiCookieAuth()
@ApiTags('Benefit - Affiliate')
@Controller('benefit/affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: AffiliateDto })
  updateAffiliate(@Param('id') id: number, @Body() dto: AffiliateDto) {
    return this.affiliateService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteAffiliate(@Param('id') id: number) {
    return this.affiliateService.delete(id);
  }
}
