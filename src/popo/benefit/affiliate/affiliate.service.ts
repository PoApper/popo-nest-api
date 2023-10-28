import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Affiliate } from './affiliate.entity';
import { AffilateDto } from './affiliate.dto';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(Affiliate)
    private readonly affiliateRepo: Repository<Affiliate>,
  ) {}

  save(dto: AffilateDto) {
    return this.affiliateRepo.save(dto);
  }

  findAll() {
    return this.affiliateRepo.find();
  }

  findById(id: number) {
    return this.affiliateRepo.findOneBy({id: id });
  }

  update(id: number, dto: AffilateDto) {
    return this.affiliateRepo.update({ id: id }, dto);
  }

  delete(id: number) {
    return this.affiliateRepo.delete({ id: id });
  }
}
