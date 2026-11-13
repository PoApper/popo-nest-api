import {
  BadRequestException,
  Body,
  Controller,
  INestApplication,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { spawnSync } from 'child_process';
import { mkdtemp, readFile, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  FileSystemStoredFile,
  FormDataRequest,
  IsFile,
  MemoryStoredFile,
  NestjsFormDataModule,
} from 'nestjs-form-data';
import * as request from 'supertest';
import { crc32, deflateRawSync } from 'zlib';

class UploadDto {
  @IsFile()
  file: MemoryStoredFile | FileSystemStoredFile;
}

@Controller('upload')
class UploadController {
  @Post('memory')
  @FormDataRequest({ storage: MemoryStoredFile })
  memory(@Body() { file }: UploadDto) {
    return {
      mimeType: file.mimeType,
      extension: file.extension,
      content: (file as MemoryStoredFile).buffer.toString('base64'),
    };
  }

  @Post('disk')
  @FormDataRequest({ storage: FileSystemStoredFile })
  async disk(@Body() { file }: UploadDto) {
    return {
      mimeType: file.mimeType,
      content: (await readFile((file as FileSystemStoredFile).path)).toString(
        'base64',
      ),
    };
  }

  @Post('reject')
  @FormDataRequest({ storage: FileSystemStoredFile })
  reject() {
    throw new BadRequestException('Rejected after parsing');
  }
}

// A complete ZIP with a highly compressed content-types entry. Patched detection
// must bound inflation even when it knows the size of the input buffer.
function compressedContentTypesZip() {
  const content = Buffer.from(
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      ' '.repeat(64 * 1024 * 1024) +
      '</Types>',
  );
  const name = Buffer.from('[Content_Types].xml');
  const compressed = deflateRawSync(content);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(crc32(content), 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  header.copy(central, 10, 8, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12);
  end.writeUInt32LE(header.length + name.length + compressed.length, 16);
  return Buffer.concat([header, name, compressed, central, name, end]);
}

function detectInChild(input: Buffer, consumer: string) {
  // An OS-level timeout contains a regression that blocks the JS event loop;
  // a Promise timeout in the Jest process would not stop that infinite loop.
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const {createRequire} = require('node:module');
        const {Readable} = require('node:stream');
        const detector = createRequire(require.resolve(${JSON.stringify(consumer)}))('file-type');
        const input = require('node:fs').readFileSync(0);
        (async () => {
          const before = process.memoryUsage().rss;
          const detectBuffer = detector.fileTypeFromBuffer ?? detector.fromBuffer;
          const type = await detectBuffer(input);
          const {FileTypeValidator} = require('@nestjs/common');
          const nestValid = await new FileTypeValidator({fileType: 'image/png'}).isValid({
            buffer: input, mimetype: 'image/png', size: input.length,
          });
          const stream = await detector.stream(Readable.from([input]));
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          console.log(JSON.stringify({
            type, streamType: stream.fileType, nestValid,
            preserved: Buffer.concat(chunks).equals(input),
            rssGrowth: process.memoryUsage().rss - before,
          }));
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `,
    ],
    { input, timeout: 5_000, encoding: 'utf8' },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  return JSON.parse(result.stdout);
}

describe('Patched file detection and multipart compatibility', () => {
  let app: INestApplication;
  let directory: string;
  let png: Buffer;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'popo-file-type-'));
    png = await readFile(join(process.cwd(), 'assets/popo.png'));
    const module = await Test.createTestingModule({
      imports: [
        NestjsFormDataModule.config({
          fileSystemStoragePath: directory,
        }),
      ],
      controllers: [UploadController],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it('preserves uploaded PNG bytes and detects MIME from bytes in memory', async () => {
    await request(app.getHttpServer())
      .post('/upload/memory')
      .attach('file', png, {
        filename: 'image.bin',
        contentType: 'application/octet-stream',
      })
      .expect(201, {
        mimeType: 'image/png',
        extension: 'png',
        content: png.toString('base64'),
      });
  });

  it('keeps Nest file validation based on the actual file content', () => {
    // Run Nest's native dynamic import in Node, outside Jest's VM loader.
    expect(detectInChild(png, '@nestjs/common').nestValid).toBe(true);
    expect(
      detectInChild(Buffer.from('not a PNG'), '@nestjs/common').nestValid,
    ).toBe(false);
  });

  it('preserves disk uploads and removes temporary files after success', async () => {
    await request(app.getHttpServer())
      .post('/upload/disk')
      .attach('file', png, 'image.png')
      .expect(201, {
        mimeType: 'image/png',
        content: png.toString('base64'),
      });
    expect(await readdir(directory)).toEqual([]);
  });

  it('removes temporary files when the upload handler rejects a request', async () => {
    await request(app.getHttpServer())
      .post('/upload/reject')
      .attach('file', png, 'image.png')
      .expect(400);
    expect(await readdir(directory)).toEqual([]);
  });

  it.each(['nestjs-form-data', '@nestjs/common'])(
    '%s finishes detection of an ASF zero-size sub-header',
    (consumer) => {
      const malformed = Buffer.from(
        '3026b2758e66cf11a6d9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'hex',
      );
      const result = detectInChild(malformed, consumer);
      expect(result.type).toBeUndefined();
      expect(result.streamType).toBeUndefined();
      expect(result.preserved).toBe(true);
    },
  );

  it('bounds ZIP inflation for known-size and streamed upload detection', () => {
    const result = detectInChild(
      compressedContentTypesZip(),
      'nestjs-form-data',
    );
    expect(result.type).toEqual({ ext: 'zip', mime: 'application/zip' });
    expect(result.streamType).toEqual(result.type);
    expect(result.preserved).toBe(true);
    expect(result.rssGrowth).toBeLessThan(32 * 1024 * 1024);
  });
});
