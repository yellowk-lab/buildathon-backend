import { Controller, Post, RawBodyRequest, Req, Res } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe/stripe.service';

@Controller('stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
  ) {}

  // @TODO: Implement a better handling of events type => too much redundant code

  // @TODO Regarding this information from Stripe docs
  // For Connect webhooks, it’s important to note that while only test webhooks will be sent to your development webhook URLs,
  // both live and test webhooks will be sent to your production webhook URLs.
  // This is due to the fact that you can perform both live and test transactions under a production application.
  // For this reason, we recommend you check the livemode value when receiving an event webhook to know what action, if any, should be taken.

  // Account Webhook: for activity on our own account
  @Post('/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const event: Stripe.Event =
      await this.stripeService.verifyAndConstructStripeEvent(req, 'account');
    if (event?.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.paymentService.processPaymentIntent(paymentIntent);
    } else if (
      // PAYOUT EVENTS
      event?.type === 'payout.created' ||
      event?.type === 'payout.updated'
    ) {
      const payoutObject = event.data?.object;
      await this.paymentService.handlePayoutUpdates(payoutObject);
    } else if (event?.type === 'balance.available') {
    } else if (
      // TRANFER EVENTS
      event?.type === 'transfer.created' ||
      event?.type === 'transfer.updated'
    ) {
      // IMPLEMENT WHAT IS NEEDED FOR TRANSFER EVENT
    }

    return res.json();
  }

  // Connect Webhook: for activity on any connect (express meaning our users) accounts
  @Post('/webhook/connect')
  async handleWebhookConnect(
    @Req() req: RawBodyRequest<Request>,
    @Req() res: Response,
  ) {
    const event: Stripe.Event =
      await this.stripeService.verifyAndConstructStripeEvent(req, 'connect');
    if (event?.type === 'payment_intent.succeeded') {
      // PAYMENT INTENT
    } else if (
      // PAYOUT EVENTS
      event?.type === 'payout.created' ||
      event?.type === 'payout.updated' ||
      event?.type === 'payout.paid'
    ) {
      const payoutObject = event.data?.object;
      await this.paymentService.handlePayoutUpdates(payoutObject);
    } else if (event?.type === 'balance.available') {
    } else if (
      // TRANFER EVENTS
      event?.type === 'transfer.created' ||
      event?.type === 'transfer.updated'
    ) {
      // IMPLEMENT WHAT IS NEEDED FOR TRANSFER EVENT
    }
    return res.ok;
  }
}
