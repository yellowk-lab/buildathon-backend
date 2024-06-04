import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeModule } from './stripe/stripe.module';
import { PaymentResolver } from './payment.resolver';
import { AuthModule } from '../auth/auth.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CurrencyConverterModule } from './currency-converter/currency-converter.module';

@Module({
  providers: [PaymentService, PaymentResolver],
  controllers: [StripeWebhookController],
  imports: [
    StripeModule,
    CurrencyConverterModule,
    AuthModule,
    TransactionsModule,
  ],
  exports: [PaymentService, StripeModule, CurrencyConverterModule],
})
export class PaymentModule {}
