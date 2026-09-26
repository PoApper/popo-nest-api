import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ReportDownloadGuard implements CanActivate {
  private active = 0;
  private count = 0;
  private windowEnd = 0;

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();
    const now = Date.now();
    if (this.windowEnd <= now) {
      this.windowEnd = now + 60_000;
      this.count = 0;
    }
    // Process-wide limits also protect clients bypassing nginx. IP limits live in nginx.
    if (this.count >= 600 || this.active >= 32) {
      response.setHeader('Retry-After', '60');
      throw new HttpException(
        '다운로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.count++;
    this.active++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.active--;
      response.removeListener('finish', release);
      response.removeListener('close', release);
    };
    response.once('finish', release);
    response.once('close', release);
    return true;
  }
}
