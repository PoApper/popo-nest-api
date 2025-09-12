import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService env/subject integration (real MailerModule)', () => {
  let app: INestApplication;
  let mailService: MailService;
  let mailerService: MailerService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MailerModule.forRoot({
          transport: {
            jsonTransport: true,
          },
        }),
      ],
      providers: [MailService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    mailService = app.get(MailService);
    mailerService = app.get(MailerService);
    process.env.POPO_MAIL_ADDRESS = 'no-reply@example.com';
  });

  afterAll(async () => {
    await app.close();
  });

  it('dev: subject includes [POPO-DEV] and title', async () => {
    process.env.NODE_ENV = 'dev';
    const spy = jest.spyOn(mailerService, 'sendMail');
    await mailService.sendReservationPatchMail(
      'user@example.com',
      '테스트예약',
      '승인',
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('[POPO-DEV]'),
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('테스트예약') }),
    );
  });

  it('prod: subject does not include [POPO-DEV] and includes title', async () => {
    process.env.NODE_ENV = 'prod';
    const spy = jest.spyOn(mailerService, 'sendMail');
    await mailService.sendReservationPatchMail(
      'user@example.com',
      '테스트예약',
      '승인',
    );
    const callArg = (spy.mock.calls[spy.mock.calls.length - 1] || [])[0];
    expect(callArg.subject).toContain('[POPO]');
    expect(callArg.subject).not.toContain('[POPO-DEV]');
    expect(callArg.subject).toContain('테스트예약');
  });
});


