import { Module } from '@nestjs/common';
import { AffiliateModule } from './affiliate/affiliate.module';
import { DiscountModule } from './discount/discount.module';

@Module({
  imports: [
    AffiliateModule,
    DiscountModule,
  ]
})
export class BenefitModule {}
