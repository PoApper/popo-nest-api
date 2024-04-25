import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Affiliate } from './affiliate.entity';
import { AffiliateDto } from './affiliate.dto';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(Affiliate)
    private readonly affiliateRepo: Repository<Affiliate>,
  ) {}

  save(dto: AffiliateDto) {
    return this.affiliateRepo.save(dto);
  }

  findAll() {
    return this.affiliateRepo.find();
  }

  findById(id: number) {
    return this.affiliateRepo.findOneBy({ id: id });
  }

  update(id: number, dto: AffiliateDto) {
    return this.affiliateRepo.update({ id: id }, dto);
  }

  delete(id: number) {
    return this.affiliateRepo.delete({ id: id });
  }
}
