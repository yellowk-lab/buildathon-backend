import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';
import { MailError } from './mail.error';
import { DeliveryAddress } from '../orders/entities/delivery-address.entity';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
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
        templateId: this.configService.get<string>(
          'SENDGRID_TEMPLATE_LOOT_CLAIMED_ID',
        ),
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

  async sendRedeemedLootConfirmation(
    email: string,
    firstName: string,
    lastName: string,
    lootName: string,
    deliveryAddress?: DeliveryAddress,
  ): Promise<boolean> {
    try {
      const subject =
        'Order confirmation success! You have ordered your exclusive gift 🎉';
      const from = {
        email: this.configService.get<string>('MAIL_FROM'),
        name: this.configService.get<string>('MAIL_NAME'),
      };
      const message: MailDataRequired = {
        from,
        to: email,
        templateId: this.configService.get<string>(
          'SENDGRID_TEMPLATE_LOOT_REDEEMED_ID',
        ),
        dynamicTemplateData: {
          first_name: firstName,
          last_name: lastName,
          subject,
          order_item_1: lootName,
          delivery_address: deliveryAddress
            ? deliveryAddress.getFullAddress()
            : null,
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
