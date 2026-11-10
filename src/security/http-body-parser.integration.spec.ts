import {
  Body,
  Controller,
  Get,
  HttpCode,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { request as httpRequest } from 'http';
import * as request from 'supertest';
import { gzipSync } from 'zlib';

@Controller()
class HttpBodyParserTestController {
  @Post('json')
  @HttpCode(200)
  acceptJson(@Body() body: unknown) {
    return { body };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({ controllers: [HttpBodyParserTestController] })
class HttpBodyParserTestModule {}

describe('HTTP body parser integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HttpBodyParserTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('parses ordinary JSON and gzip-compressed JSON', async () => {
    const body = { message: 'parser works' };

    await request(app.getHttpServer())
      .post('/json')
      .send(body)
      .expect(200, { body });

    const compressedResponse = await postGzip(gzipSync(JSON.stringify(body)));
    expect(compressedResponse.status).toBe(200);
    expect(JSON.parse(compressedResponse.body)).toEqual({ body });
  });

  it.each([
    ['malformed gzip', Buffer.from('not-a-gzip-stream')],
    [
      'gzip with trailing data',
      Buffer.concat([
        gzipSync(JSON.stringify({ message: 'parser works' })),
        Buffer.from('trailing-garbage'),
      ]),
    ],
  ])('rejects %s without terminating the server', async (_name, payload) => {
    const response = await postGzip(payload);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });

  function postGzip(
    payload: Buffer | string,
  ): Promise<{ status: number; body: string }> {
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Test HTTP server did not bind to a TCP port');
    }

    const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    return new Promise((resolve, reject) => {
      const req = httpRequest(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/json',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Content-Length': buffer.length,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () =>
            resolve({
              status: res.statusCode ?? 0,
              body: Buffer.concat(chunks).toString(),
            }),
          );
        },
      );
      req.on('error', reject);
      req.end(buffer);
    });
  }
});
