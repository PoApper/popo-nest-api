import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as momentTz from 'moment-timezone';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello POPO! (popo-${
      process.env.POPO_VERSION
    }) (server now: ${moment().format(
      'YYYY-MM-DD HH:mm:ss',
    )}, KST now: ${momentTz().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')})`;
  }
}
