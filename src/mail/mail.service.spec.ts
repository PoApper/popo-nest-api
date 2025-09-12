import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let mailService: MailService;
  const mailerMock = { sendMail: jest.fn().mockResolvedValue({}) };
  const configMock = {
    get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'dev' : undefined)),
  } as unknown as ConfigService;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NODE_ENV = 'dev';
    process.env.POPO_MAIL_ADDRESS = 'no-reply@example.com';

    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    mailService = moduleRef.get(MailService);
  });

  it('sendVerificationMail builds expected payload', async () => {
    await mailService.sendVerificationMail('user@example.com', 'uuid-123');
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'no-reply@example.com',
        subject: expect.stringContaining('가입 인증'),
        html: expect.stringContaining('uuid-123'),
        attachments: expect.arrayContaining([
          expect.objectContaining({ cid: 'popoLogo' }),
        ]),
      }),
    );
  });

  it('sendPasswordResetMail builds expected payload', async () => {
    await mailService.sendPasswordResetMail('user@example.com', 'P@ssw0rd!');
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'no-reply@example.com',
        subject: expect.stringContaining('비밀번호 초기화'),
        html: expect.stringContaining('P@ssw0rd!'),
      }),
    );
  });

  it('sendReservationPatchMail builds expected payload', async () => {
    await mailService.sendReservationPatchMail(
      'user@example.com',
      '테스트예약',
      '승인',
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'no-reply@example.com',
        subject: expect.stringContaining('테스트예약'),
        html: expect.stringContaining('승인'),
      }),
    );
  });

  it('sendPlaceReserveCreateMailToBooker validates email', async () => {
    await expect(
      mailService.sendPlaceReserveCreateMailToBooker(
        'invalid-email',
        { name: '장소' } as any,
        {
          title: '제목',
          date: '2024-01-01',
          startTime: '10:00',
          endTime: '11:00',
        } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sendPlaceReserveCreateMailToBooker sends expected payload with valid email', async () => {
    await mailService.sendPlaceReserveCreateMailToBooker(
      'user@example.com',
      { name: '장소' } as any,
      {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
      } as any,
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'no-reply@example.com',
        subject: expect.stringContaining('장소 예약'),
        html: expect.stringContaining('제목'),
      }),
    );
  });

  it('sendPlaceReserveCreateMailToStaff sends when recipient email is valid', async () => {
    await mailService.sendPlaceReserveCreateMailToStaff(
      'staff@example.com',
      { name: '장소' } as any,
      {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
      } as any,
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
  });

  it('sendPlaceReserveCreateMailToStaff sends in prod with valid recipient', async () => {
    (configMock.get as any).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'prod' : undefined,
    );
    jest.clearAllMocks();
    await mailService.sendPlaceReserveCreateMailToStaff(
      'staff@example.com',
      { name: '장소' } as any,
      {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
      } as any,
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
  });

  it('sendEquipReserveCreateMailToBooker validates email', async () => {
    await expect(
      mailService.sendEquipReserveCreateMailToBooker('invalid-email', {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sendEquipReserveCreateMailToStaff sends when recipient email is valid', async () => {
    await mailService.sendEquipReserveCreateMailToStaff(
      'staff@example.com',
      [{ name: '장비A' }] as any,
      {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        end_time: '11:00',
      } as any,
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
  });

  it('sendEquipReserveCreateMailToStaff sends in prod (falls back to ADMIN_EMAIL if invalid)', async () => {
    (configMock.get as any).mockImplementation((key: string) =>
      key === 'NODE_ENV' ? 'prod' : undefined,
    );
    process.env.ADMIN_EMAIL = 'admin@example.com';
    jest.clearAllMocks();
    await mailService.sendEquipReserveCreateMailToStaff(
      'invalid-email',
      [{ name: '장비A' }] as any,
      {
        title: '제목',
        date: '2024-01-01',
        startTime: '10:00',
        end_time: '11:00',
      } as any,
    );
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'admin@example.com' }),
    );
  });
});
