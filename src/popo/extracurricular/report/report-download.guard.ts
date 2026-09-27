import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface DownloadWindow {
  active: number;
  count: number;
  windowEnd: number;
}

@Injectable()
export class ReportDownloadGuard implements CanActivate {
  private readonly clients = new Map<string, DownloadWindow>();
  private nextSweep = 0;

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const now = Date.now();
    if (this.nextSweep <= now) {
      for (const [key, client] of this.clients) {
        if (client.active === 0 && client.windowEnd <= now)
          this.clients.delete(key);
      }
      this.nextSweep = now + 60_000;
    }
    // Express resolves forwarded addresses only through explicitly trusted proxies.
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    let client = this.clients.get(key);
    if (!client) {
      client = { active: 0, count: 0, windowEnd: now + 60_000 };
      this.clients.set(key, client);
    } else if (client.windowEnd <= now) {
      client.windowEnd = now + 60_000;
      client.count = 0;
    }
    if (client.count >= 600 || client.active >= 32) {
      response.setHeader('Retry-After', '60');
      throw new HttpException(
        '다운로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    client.count++;
    client.active++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      client.active--;
      if (client.active === 0 && client.windowEnd <= Date.now())
        this.clients.delete(key);
      response.removeListener('finish', release);
      response.removeListener('close', release);
    };
    response.once('finish', release);
    response.once('close', release);
    return true;
  }
}
