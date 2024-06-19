import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';
import { MailError } from './mail.error';

@Injectable()
export class MailService {
  private readonly winnerTemplateId: string;

  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
    this.winnerTemplateId = this.configService.get<string>(
      'SENDGRID_TEMPLATE_WINNER_ID',
    );
  }

  async sendWinnerConfirmation(
    email: string,
    imgUrl: string,
    displayName: string,
  ): Promise<boolean> {
    try {
      const subject = "Well Done! You've Claimed Your Exclusive Loot 🎉";
      const from = {
        email: this.configService.get<string>('MAIL_FROM'),
        name: this.configService.get<string>('MAIL_NAME'),
      };
      const message: MailDataRequired = {
        from,
        to: email,
        subject,
        templateId: this.winnerTemplateId,
        dynamicTemplateData: {
          loot_img_url: imgUrl,
          loot_display_name: displayName,
        },
      };
      const [mailResponse] = await sgMail.send(message);
      if (mailResponse.statusCode == 202) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new MailError(MailError.SERVER_CODES.INTERNAL_SERVER_ERROR, error);
    }
  }
}
