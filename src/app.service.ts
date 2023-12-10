import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello POPO! (popo-${process.env.POPO_VERSION}) (now: ${moment().format('YYYY-MM-DD HH:mm:ss')})`;
  }
}
