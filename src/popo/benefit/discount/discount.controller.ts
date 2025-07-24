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

import { DiscountService } from './discount.service';
import { DiscountDto } from './discount.dto';
import { Roles } from 'src/auth/authroization/roles.decorator';
import { RolesGuard } from 'src/auth/authroization/roles.guard';
import { UserType } from 'src/popo/user/user.meta';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from '../../../common/public-guard.decorator';

@ApiCookieAuth()
@ApiTags('Benefit - Discount')
@Controller('benefit/discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: DiscountDto })
  createDiscount(@Body() dto: DiscountDto) {
    return this.discountService.save(dto);
  }

  @Public()
  @Get()
  getAllDiscounts() {
    return this.discountService.findAll();
  }

  @Public()
  @Get(':id')
  getDiscountByUuid(@Param('id') id: number) {
    return this.discountService.findById(id);
  }

  @Put(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBody({ type: DiscountDto })
  updateDiscount(@Param('id') id: number, @Body() dto: DiscountDto) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserType.admin, UserType.association)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteDiscount(@Param('id') id: number) {
    return this.discountService.delete(id);
  }
}
