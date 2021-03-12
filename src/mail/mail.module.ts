import {Module} from '@nestjs/common';
import {MailService} from "./mail.service";
import {MailerModule} from "@nestjs-modules/mailer";
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRoot({
    transport: {
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    }
  })],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {
}