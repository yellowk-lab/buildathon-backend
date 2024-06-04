import { Injectable } from '@nestjs/common';
import { SalesService } from './sales.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PaymentSuccessEvent,
  PAYMENT_SUCCESS,
} from '../payment/events/payment-success.event';
@Injectable()
export class SalesListener {
  constructor(private readonly salesService: SalesService) {}

  @OnEvent(PAYMENT_SUCCESS)
  async handlePaymentSuccessEvent(event: PaymentSuccessEvent) {
    await this.salesService.creationProcess(event);
  }
}
