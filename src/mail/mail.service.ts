import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWinnerConfirmation(
    email: string,
    imgUrl: string,
    displayName: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Congratulations on winning !',
      template: './win',
      context: {
        img_url_gift: imgUrl,
        display_name_gift: displayName,
      },
    });
  }
  async sendPrizeDrawRegistration(email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Raffle registration validated !',
      template: './prizeDraw',
    });
  }
}
