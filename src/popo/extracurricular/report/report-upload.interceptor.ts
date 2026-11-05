import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createWriteStream } from 'fs';
import { mkdtemp, rm, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as multer from 'multer';
import { FileSystemStoredFile } from 'nestjs-form-data';
import { defer, lastValueFrom } from 'rxjs';
import { REPORT_MAX_FILE_SIZE } from './report-file-format';

interface UploadFile {
  stream: Readable;
  path: string;
  size: number;
  originalname: string;
  encoding: string;
  mimetype: string;
}

// Limits apply before multipart parsing and remain held through storage I/O.
@Injectable()
export class ReportUploadInterceptor implements NestInterceptor {
  private readonly active = new Map<string, number>();
  private total = 0;

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { uuid: string }; file?: UploadFile }>();
    const res = context.switchToHttp().getResponse<Response>();
    if (!req.is('multipart/form-data')) return next.handle();

    return defer(async () => {
      const principal = req.user?.uuid;
      if (!principal) throw new UnauthorizedException();
      const count = this.active.get(principal) ?? 0;
      if (count >= 2 || this.total >= 16) {
        throw new HttpException(
          '진행 중인 업로드가 많습니다. 잠시 후 다시 시도해주세요.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.active.set(principal, count + 1);
      this.total++;
      let directory: string;
      const abort = new AbortController();
      const writes: Promise<void>[] = [];
      const onAborted = () => abort.abort();
      req.once('aborted', onAborted);
      try {
        directory = await mkdtemp(join(tmpdir(), 'popo-report-'));
        const storage = {
          _handleFile: (
            _request: Request,
            file: UploadFile,
            callback: (error: Error | null, info?: object) => void,
          ) => {
            const path = join(directory, 'document');
            const output = createWriteStream(path, {
              flags: 'wx',
              mode: 0o600,
            });
            const write = pipeline(file.stream, output, {
              signal: abort.signal,
            })
              .then(() => callback(null, { path, size: output.bytesWritten }))
              .catch((error: Error) => {
                // Multer handles source errors itself and decrements its counter.
                if (!file.stream.errored) callback(error);
              });
            writes.push(write);
          },
          _removeFile: (
            _request: Request,
            file: UploadFile,
            callback: (error?: Error) => void,
          ) => {
            if (!file.path) return callback();
            unlink(file.path).then(() => callback(), callback);
          },
        };
        const parse = multer({
          storage,
          limits: {
            // Busboy emits "limit" when the boundary is reached, not exceeded.
            // DTO validation still enforces the inclusive 20 MiB maximum.
            fileSize: REPORT_MAX_FILE_SIZE + 1,
            files: 1,
            fields: 8,
            parts: 10,
            fieldSize: 64 * 1024,
          },
        }).single('file');
        await new Promise<void>((resolve, reject) => {
          const onAbort = () =>
            reject(new BadRequestException('업로드가 중단되었습니다.'));
          abort.signal.addEventListener('abort', onAbort, { once: true });
          if (req.aborted) abort.abort();
          if (abort.signal.aborted) return onAbort();
          parse(req, res, (error?: Error) => {
            abort.signal.removeEventListener('abort', onAbort);
            if (error)
              reject(new BadRequestException('잘못된 업로드 요청입니다.'));
            else resolve();
          });
        });
        if (req.file) {
          if (Object.prototype.hasOwnProperty.call(req.body, 'file')) {
            throw new BadRequestException('파일 필드는 중복될 수 없습니다.');
          }
          req.body.file = Object.assign(new FileSystemStoredFile(), {
            path: req.file.path,
            size: req.file.size,
            originalName: req.file.originalname,
            encoding: req.file.encoding,
            busBoyMimeType: req.file.mimetype,
          });
        }
        return await lastValueFrom(next.handle());
      } finally {
        abort.abort();
        req.removeListener('aborted', onAborted);
        try {
          await Promise.allSettled(writes);
          if (directory) await rm(directory, { recursive: true, force: true });
        } finally {
          const remaining = this.active.get(principal) - 1;
          if (remaining) this.active.set(principal, remaining);
          else this.active.delete(principal);
          this.total--;
        }
      }
    });
  }
}
