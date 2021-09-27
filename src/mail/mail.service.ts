import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationMail(email: string, uuid: string) {
    await this.mailerService.sendMail({
      to: email,
      from: process.env.GMAIL_USER,
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
             <a href="https://popo.poapper.com/activateAccount/${uuid}" style="text-decoration: inherit;">
              계정 활성하기
             </a>
          </div>
          <p>😱본인이 시도한 회원가입이 아니라면, 즉시 POPO 관리팀에게 연락바랍니다.😱</p>
        </body>
      </html>`,
    });
    console.log(`success to mailing: ${email}`);
  }

  // TODO: refactor date and time format
  async sendReserveCreateToStaff(email: string, place, reservation) {
    await this.mailerService.sendMail({
      to: email,
      from: process.env.GMAIL_USER,
      subject: `[POPO] 예약이 생성되었습니다.`,
      html: `
      <html>
        <head>
            <meta charset="utf-8">
            <style>
            </style>
        </head>
        <body>
          <h2>[POPO] 장소 예약이 생성되었습니다</h2>
          <p>장소 ${place.name}에 대한 예약 "<strong>${reservation.title}</strong>"(${reservation.date} - ${reservation.startTime} ~ ${reservation.endTime})이/가 생성 되었습니다.</p>
          <p>예약 담당자 님은 예약을 확인하고 처리해주세요 🙏</p>
        </body>
      </html>`,
    });
    console.log(`예약 생성 메일: success to mailing: ${email}`);
  }

  async sendReserveStatusMail(email: string, title: string, status: string) {
    await this.mailerService.sendMail({
      to: email,
      from: process.env.GMAIL_USER,
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
