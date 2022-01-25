import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Whitebook } from './whitebook.entity';
import { WhitebookDto } from './whitebook.dto';

@Injectable()
export class WhitebookService {
  constructor(
    @InjectRepository(Whitebook)
    private readonly whitebookRepo: Repository<Whitebook>,
  ) {}

  save(dto: WhitebookDto) {
    return this.whitebookRepo.save(dto);
  }

  findAll(orderOption: object) {
    return this.whitebookRepo.find({ order: orderOption });
  }

  addOneClickCount(uuid: string) {
    this.whitebookRepo.findOne(uuid).then((whitebook) => {
      return this.whitebookRepo.update(uuid, {
        click_count: whitebook.click_count + 1,
      });
    });
  }

  update(uuid: string, dto: WhitebookDto) {
    return this.whitebookRepo.update(uuid, dto);
  }

  delete(uuid: string) {
    return this.whitebookRepo.delete(uuid);
  }
}
