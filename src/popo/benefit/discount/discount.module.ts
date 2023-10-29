import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Discount } from './discount.entity';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discount]),
  ],
  providers: [DiscountService],
  controllers: [DiscountController],
})
export class DiscountModule {}
