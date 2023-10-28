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

import { DiscountService } from './discount.service';
import { DiscountDto } from './discount.dto';

@ApiTags('Benefit/Discount')
@Controller('benefit/discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @ApiBody({ type: DiscountDto })
  createDiscount(@Body() dto: DiscountDto) {
    return this.discountService.save(dto);
  }

  @Get()
  getAllDiscounts() {
    return this.discountService.findAll();
  }

  @Get(':id')
  getDiscountByUuid(@Param('id') id: number) {
    return this.discountService.findById(id);
  }

  @Put(':id')
  @ApiBody({ type: DiscountDto })
  updateDiscount(@Param('id') id: number, @Body() dto: DiscountDto) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  deleteDiscount(@Param('id') id: number) {
    return this.discountService.delete(id);
  }
}
