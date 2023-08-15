import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as EmailValidator from 'email-validator';
import { Equip } from '../popo/equip/equip.entity';
import { Place } from '../popo/place/place.entity';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(recipient_email: string, uuid: string) {
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: '[POPO] 가입 인증',
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>POPO 가입 인증</h2>
          <p>POPO를 통해 POSTECH 총학생회에서 제공하는 여러 서비스를 이용해보실 수 있습니다 😊</p>
          <p>- <b>POPO, POstechian's POrtal</b> 드림 -</p>
          <br/>
          <div style="padding: 2px; background-color: crimson; color: white; text-align: center;">
             <a href="https://popo.poapper.club/auth/activate-account/${uuid}" style="text-decoration: inherit;">
              계정 활성하기
             </a>
          </div>
          <p>😱본인이 시도한 회원가입이 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
    });
    console.log(`success to mailing: ${recipient_email}`);
  }

  async sendPasswordResetMail(recipient_email: string, temp_password: string) {
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: '[POPO] 비밀번호 초기화',
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>POPO 비밀번호 초기화</h2>
          <p>비밀번호 초기화 요청에 따라 비밀번호를 초기화 해드립니다: ${temp_password}</p>
          <p>로그인 후에 마이페이지에서 비밀번호를 새로 설정하시기 바랍니다.</p>
          <p>- <b>POPO, POstechian's POrtal</b> 드림 -</p>
          <p>😱본인이 시도한 초기화 요청이 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
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
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: `[POPO] 장소 예약이 생성되었습니다.`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 장소 예약이 생성되었습니다</h2>
          <p>장소 ${place.name}에 대한 예약 "<strong>${reservation.title}</strong>"(${reservation.date} - ${reservation.start_time} ~ ${reservation.end_time})이/가 생성 되었습니다.</p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
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
    recipient_email = EmailValidator.validate(recipient_email)
      ? recipient_email
      : process.env.ADMIN_EMAIL;
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: `[POPO] 장소 예약이 생성되었습니다.`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 장소 예약이 생성되었습니다</h2>
          <p>장소 ${place.name}에 대한 예약 "<strong>${reservation.title}</strong>"(${reservation.date} - ${reservation.start_time} ~ ${reservation.end_time})이/가 생성 되었습니다.</p>
          <p>장소 예약 담당자 님은 예약을 확인하고 처리해주세요 🙏</p>
        </body>
      </html>`,
    });
    console.log(
      `장소 예약 생성 메일 (담당자): success to mailing: ${recipient_email}`,
    );
  }

  // TODO: refactor date and time format
  async sendEquipReserveCreateMailToBooker(
    recipient_email: string,
    reservation,
  ) {
    if (!EmailValidator.validate(recipient_email)) {
      throw new BadRequestException(`invalid booker email: ${recipient_email}`);
    }
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: `[POPO] 장비 예약이 생성되었습니다.`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 장비 예약이 생성되었습니다</h2>
          <p>장비 예약 "<strong>${reservation.title}</strong>"(${reservation.date} - ${reservation.start_time} ~ ${reservation.end_time})이/가 생성 되었습니다.</p>
          <p>예약한 장비의 예약비를 확인해주세요.</p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
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
    recipient_email = EmailValidator.validate(recipient_email)
      ? recipient_email
      : process.env.ADMIN_EMAIL;
    await this.mailerService.sendMail({
      to: recipient_email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: `[POPO] 장비 예약이 생성되었습니다.`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 장비 예약이 생성되었습니다</h2>
          <p>장비 ${equipments
            .map((equip) => equip.name)
            .join(', ')}에 대한 예약 "<strong>${reservation.title}</strong>"(${
        reservation.date
      } - ${reservation.start_time} ~ ${
        reservation.end_time
      })이/가 생성 되었습니다.</p>
          <p>장비 예약 담당자 님은 예약을 확인하고 처리해주세요 🙏</p>
        </body>
      </html>`,
    });
    console.log(
      `장비 예약 생성 메일 (담당자): success to mailing: ${recipient_email}`,
    );
  }

  async sendReservationPatchMail(email: string, title: string, status: string) {
    await this.mailerService.sendMail({
      to: email,
      from: process.env.POPO_MAIL_ADDRESS,
      subject: `[POPO] 예약이 ${status} 되었습니다!`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 예약 ${status}</h2>
          <p>예약 "<strong>${title}</strong>"이/가 ${status} 되었습니다.</p>
          <p>- <b>POPO, POstechian's Portal</b> 드림 -</p>
          <br/>
          <p>😱본인의 예약 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
    });
    console.log(`success to mailing: ${email}`);
  }
}
