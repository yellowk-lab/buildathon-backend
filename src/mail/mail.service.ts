import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendWinnerConfirmation(
    email: string,
    imgUrl: string,
    displayName: string,
  ) {
    throw Error(`MailService: sendWinnerConfirmation not implemented yet`);
  }
  async sendPrizeDrawRegistration(email: string) {
    throw Error(`MailService: sendPrizeDrawRegistration not implemented yet`);
  }
}
