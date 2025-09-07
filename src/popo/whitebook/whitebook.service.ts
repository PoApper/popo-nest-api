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

  findAll(orderOption: object, isLoginUser = false) {
    if (isLoginUser) {
      return this.whitebookRepo.find({ order: orderOption });
    } else {
      return this.whitebookRepo.find({
        order: orderOption,
        where: { showOnlyLogin: false },
      });
    }
  }

  async addOneClickCount(uuid: string) {
    const whitebook = await this.whitebookRepo.findOneBy({ uuid: uuid });
    return this.whitebookRepo.update(uuid, {
      clickCount: whitebook.clickCount + 1,
    });
  }

  update(uuid: string, dto: WhitebookDto) {
    return this.whitebookRepo.update(uuid, dto);
  }

  delete(uuid: string) {
    return this.whitebookRepo.delete(uuid);
  }
}
