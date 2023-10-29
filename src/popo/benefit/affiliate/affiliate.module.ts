import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Affiliate } from './affiliate.entity';
import { AffiliateController } from './affiliate.controller';
import { AffiliateService } from './affiliate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Affiliate]),
  ],
  providers: [AffiliateService],
  controllers: [AffiliateController],
})
export class AffiliateModule {}
