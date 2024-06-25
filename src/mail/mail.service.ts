import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';
import { MailError } from './mail.error';
// import { Order } from '../orders/entities/order.entity';
// import { DeliveryAddress } from '../orders/entities/delivery-address.entity';

@Injectable()
export class MailService {
  private readonly claimLootTemplateId: string;

  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
    this.claimLootTemplateId = this.configService.get<string>(
      'SENDGRID_TEMPLATE_WINNER_ID',
    );
  }

  async sendClaimedLootConfirmation(
    email: string,
    imgUrl: string,
    name: string,
  ): Promise<boolean> {
    try {
      const subject = 'Well Done! You have Claimed Your Exclusive Loot 🎉';
      const from = {
        email: this.configService.get<string>('MAIL_FROM'),
        name: this.configService.get<string>('MAIL_NAME'),
      };
      const message: MailDataRequired = {
        from,
        to: email,
        templateId: this.claimLootTemplateId,
        dynamicTemplateData: {
          loot_img_url: imgUrl,
          loot_display_name: name,
          subject,
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

  // async sendRedeemedLootConfirmation(
  //   email: string,
  //   order: Order,
  //   deliveryAddress?: DeliveryAddress,
  // ) {}
}
