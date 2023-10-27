import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello POPO! (popo-${process.env.POPO_VERSION})`;
  }
}
