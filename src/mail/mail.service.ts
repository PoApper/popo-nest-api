import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as EmailValidator from 'email-validator';
import { Equip } from '../popo/equip/equip.entity';
import { Place } from '../popo/place/place.entity';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationMail(recipient_email: string, uuid: string) {
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? '[POPO] 가입 인증'
        : '[POPO-DEV] 가입 인증';

    await this.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>POPO를 통해 POSTECH 총학생회에서 제공하는 여러 서비스를 이용해보실 수 있습니다 😊</p>
          <br/>
          <div style="padding: 2px; background-color: crimson; text-align: center;">
             <a href="https://${host_domain}/auth/activate-account/${uuid}" style="text-decoration: none; color: white">
              계정 활성하기
             </a>
          </div>
          <p>😱본인이 시도한 회원가입이 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(`success to mailing: ${recipient_email}`);
  }

  async sendPasswordResetMail(recipient_email: string, temp_password: string) {
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? '[POPO] 비밀번호 초기화'
        : '[POPO-DEV] 비밀번호 초기화';

    await this.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>비밀번호 초기화 요청에 따라 비밀번호를 초기화 해드립니다: "${temp_password}"</p>
          <p>로그인 후에 마이페이지에서 비밀번호를 새로 설정하시기 바랍니다.</p>
          <p>- <b>POPO, POstechian's POrtal</b> 드림 -</p>
          <p>😱본인이 시도한 초기화 요청이 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(`success to mailing: ${recipient_email}`);
  }

  // TODO: refactor date and time format
  async sendPlaceReserveCreateMailToBooker(
    recipient_email: string,
    place: Place,
    reservation,
  ) {
    if (!EmailValidator.validate(recipient_email)) {
      throw new BadRequestException(`invalid booker email: ${recipient_email}`);
    }
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? `[POPO] ${place.name}에 대한 장소 예약이 생성되었습니다.`
        : `[POPO-DEV] ${place.name}에 대한 장소 예약이 생성되었습니다.`;

    await this.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>
            장소 ${place.name}에 대한 예약
            "<strong>${reservation.title}</strong>"
            (${reservation.date} - ${reservation.startTime} ~ ${reservation.endTime})이/가
            생성 되었습니다.
          </p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(
      `장소 예약 생성 메일 (예약자): success to mailing: ${recipient_email}`,
    );
  }

  // TODO: refactor date and time format
  async sendPlaceReserveCreateMailToStaff(
    recipient_email: string,
    place: Place,
    reservation,
  ) {
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? `[POPO] ${place.name}에 대한 장소 예약이 생성되었습니다. (담당자용)`
        : `[POPO-DEV] ${place.name}에 대한 장소 예약이 생성되었습니다. (담당자용)`;

    recipient_email = EmailValidator.validate(recipient_email)
      ? recipient_email
      : null;
    if (recipient_email) {
      await this.sendMail({
        to: recipient_email,
        from: process.env.POPO_MAIL_ADDRESS,
        subject: subject,
        html: `
        <html>
          <head>
              <meta charset="utf-8">
              <style>
              </style>
          </head>
          <body>
            <div>
              <img src="cid:popoLogo"/>
            </div>
            <p>
              장소 ${place.name}에 대한 예약
              "<strong>${reservation.title}</strong>"
              (${reservation.date} - ${reservation.startTime} ~ ${reservation.endTime})이/가
              생성 되었습니다.
            </p>
            <p>장소 예약 담당자 님은 예약을 확인하고 처리해주세요 🙏</p>
          </body>
        </html>`,
        attachments: [
          {
            filename: 'popo.png',
            path: './assets/popo.png',
            cid: 'popoLogo',
          },
        ],
      });
      console.log(
        `장소 예약 생성 메일 (담당자): success to mailing: ${recipient_email}`,
      );
    }
  }

  // TODO: refactor date and time format
  async sendEquipReserveCreateMailToBooker(
    recipient_email: string,
    reservation,
  ) {
    if (!EmailValidator.validate(recipient_email)) {
      throw new BadRequestException(`invalid booker email: ${recipient_email}`);
    }
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? `[POPO] 장비 예약이 생성되었습니다.`
        : `[POPO-DEV] 장비 예약이 생성되었습니다.`;

    await this.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>장비 예약 "<strong>${reservation.title}</strong>"(${reservation.date} - ${reservation.startTime} ~ ${reservation.endTime})이/가 생성 되었습니다.</p>
          <p>예약한 장비의 예약비를 확인해주세요.</p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(
      `장비 예약 생성 메일 (예약자): success to mailing: ${recipient_email}`,
    );
  }

  // TODO: refactor date and time format
  async sendEquipReserveCreateMailToStaff(
    recipient_email: string,
    equipments: Equip[],
    reservation,
  ) {
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? `[POPO] 장비 예약이 생성되었습니다. (담당자용)`
        : `[POPO-DEV] 장비 예약이 생성되었습니다. (담당자용)`;

    recipient_email = EmailValidator.validate(recipient_email)
      ? recipient_email
      : process.env.ADMIN_EMAIL;
    await this.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>장비 ${equipments
            .map((equip) => equip.name)
            .join(', ')}에 대한 예약 "<strong>${reservation.title}</strong>"(${
            reservation.date
          } - ${reservation.startTime} ~ ${
            reservation.end_time
          })이/가 생성 되었습니다.</p>
          <p>장비 예약 담당자 님은 예약을 확인하고 처리해주세요 🙏</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(
      `장비 예약 생성 메일 (담당자): success to mailing: ${recipient_email}`,
    );
  }

  async sendReservationPatchMail(email: string, title: string, status: string) {
    const host_domain = this.getHostDomain();
    const subject =
      host_domain == 'popo.poapper.club'
        ? `[POPO] ${title} 예약이 ${status} 되었습니다!`
        : `[POPO-DEV] ${title} 예약이 ${status} 되었습니다!`;

    await this.sendMail({
      to: email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: subject,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <div>
            <img src="cid:popoLogo"/>
          </div>
          <p>예약 "<strong>${title}</strong>"이/가 ${status} 되었습니다.</p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <br/>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
      attachments: [
        {
          filename: 'popo.png',
          path: './assets/popo.png',
          cid: 'popoLogo',
        },
      ],
    });
    console.log(`success to mailing: ${email}`);
  }

  private getHostDomain() {
    return this.configService.get('NODE_ENV') === 'prod'
      ? 'popo.poapper.club'
      : this.configService.get('NODE_ENV') === 'dev'
        ? 'popo-dev.poapper.club'
        : 'localhost';
  }

  private async sendMail(mailOptions) {
    try {
      return await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      if (this.shouldIgnoreLocalSmtpError(error)) {
        this.logger.warn(
          `Ignored local SMTP connection error: ${error.message}`,
        );
        return;
      }

      throw error;
    }
  }

  private shouldIgnoreLocalSmtpError(error): boolean {
    const isLocalEnv =
      this.configService.get('NODE_ENV') === 'local' ||
      process.env.NODE_ENV === 'local';
    const isLocalSmtpRefused =
      error?.code === 'ECONNREFUSED' ||
      (error?.code === 'ESOCKET' && error?.message?.includes('ECONNREFUSED'));

    return (
      isLocalEnv &&
      isLocalSmtpRefused &&
      (error?.address === '127.0.0.1' ||
        error?.message?.includes('127.0.0.1')) &&
      (Number(error?.port) === 587 || error?.message?.includes(':587'))
    );
  }
}
