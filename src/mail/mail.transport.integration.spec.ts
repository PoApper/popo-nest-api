import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { simpleParser } from 'mailparser';
import { createServer, Server, Socket } from 'net';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { MailService } from './mail.service';

const mailAddress = 'no-reply@example.com';
const recipientAddress = 'user@example.com';

async function createMailModule(transport): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [MailerModule.forRoot({ transport })],
    providers: [
      MailService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => (key === 'NODE_ENV' ? 'dev' : undefined),
        },
      },
    ],
  }).compile();
}

describe('MailService with real Nodemailer transports', () => {
  let moduleRef: TestingModule;
  const previousMailAddress = process.env.POPO_MAIL_ADDRESS;
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.POPO_MAIL_ADDRESS = mailAddress;
    process.env.NODE_ENV = 'dev';
  });

  afterEach(async () => {
    await moduleRef?.close();
    if (previousMailAddress === undefined) {
      delete process.env.POPO_MAIL_ADDRESS;
    } else {
      process.env.POPO_MAIL_ADDRESS = previousMailAddress;
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('renders the expected verification message and inline PNG without delivery', async () => {
    moduleRef = await createMailModule({
      streamTransport: true,
      buffer: true,
      newline: 'windows',
    });
    const mailService = moduleRef.get(MailService);
    const mailerService = moduleRef.get(MailerService);
    const sendMail = jest.spyOn(mailerService, 'sendMail');

    await mailService.sendVerificationMail(
      recipientAddress,
      'verification-uuid',
    );

    expect(sendMail).toHaveBeenCalledTimes(1);
    const sendResult = await sendMail.mock.results[0].value;
    expect(sendResult.envelope).toEqual({
      from: mailAddress,
      to: [recipientAddress],
    });

    const parsed = await simpleParser(sendResult.message);
    expect(parsed.from?.value.map(({ address }) => address)).toEqual([
      mailAddress,
    ]);
    const parsedRecipients = Array.isArray(parsed.to)
      ? parsed.to.flatMap(({ value }) => value)
      : (parsed.to?.value ?? []);
    expect(parsedRecipients.map(({ address }) => address)).toEqual([
      recipientAddress,
    ]);
    expect(parsed.subject).toBe('[POPO-DEV] 가입 인증');
    expect(parsed.html).toContain('verification-uuid');
    expect(parsed.html).toContain(
      'https://popo-dev.poapper.club/auth/activate-account/verification-uuid',
    );
    expect(sendResult.message.toString()).toContain('cid:popoLogo');
    expect(parsed.html).toContain('data:image/png;base64,');

    const inlinePng = parsed.attachments.find(
      ({ contentId }) => contentId?.replace(/[<>]/g, '') === 'popoLogo',
    );
    expect(inlinePng).toBeDefined();
    expect(inlinePng?.filename).toBe('popo.png');
    expect(inlinePng?.contentType).toBe('image/png');
    expect(inlinePng?.contentDisposition).toBe('inline');
    expect(inlinePng?.content).toEqual(
      await readFile(join(process.cwd(), 'assets/popo.png')),
    );
  });

  it('propagates an SMTP recipient rejection without delivering the message', async () => {
    let smtpSocket: Socket | undefined;
    const commands: string[] = [];
    const smtpServer: Server = createServer((socket) => {
      smtpSocket = socket;
      socket.setEncoding('utf8');
      socket.write('220 localhost ESMTP test\r\n');
      let pending = '';
      socket.on('data', (chunk: string) => {
        pending += chunk;
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';
        for (const line of lines) {
          if (!line) continue;
          commands.push(line);
          if (/^EHLO /i.test(line) || /^HELO /i.test(line)) {
            socket.write('250 localhost\r\n');
          } else if (/^MAIL FROM:/i.test(line)) {
            socket.write('250 sender accepted\r\n');
          } else if (/^RCPT TO:/i.test(line)) {
            socket.write('550 5.1.1 recipient rejected for test\r\n');
          } else if (/^QUIT/i.test(line)) {
            socket.write('221 closing connection\r\n');
            socket.end();
          } else {
            socket.write('250 ok\r\n');
          }
        }
      });
    });

    await new Promise<void>((resolve) =>
      smtpServer.listen(0, '127.0.0.1', resolve),
    );
    const address = smtpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('SMTP test server did not bind to a TCP port');
    }

    try {
      moduleRef = await createMailModule({
        host: '127.0.0.1',
        port: address.port,
        secure: false,
        connectionTimeout: 2_000,
        greetingTimeout: 2_000,
        socketTimeout: 2_000,
      });
      const mailService = moduleRef.get(MailService);

      await expect(
        mailService.sendVerificationMail(recipientAddress, 'rejected-uuid'),
      ).rejects.toMatchObject({ responseCode: 550 });
      expect(commands.some((line) => /^RCPT TO:/i.test(line))).toBe(true);
      expect(commands.some((line) => /^DATA$/i.test(line))).toBe(false);
    } finally {
      smtpSocket?.destroy();
      await new Promise<void>((resolve, reject) =>
        smtpServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
