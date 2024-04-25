import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Discount } from './discount.entity';
import { DiscountDto } from './discount.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepo: Repository<Discount>,
  ) {}

  save(dto: DiscountDto) {
    return this.discountRepo.save(dto);
  }

  findAll() {
    return this.discountRepo.find();
  }

  findById(id: number) {
    return this.discountRepo.findOneBy({ id: id });
  }

  update(id: number, dto: DiscountDto) {
    return this.discountRepo.update({ id: id }, dto);
  }

  delete(id: number) {
    return this.discountRepo.delete({ id: id });
  }
}
