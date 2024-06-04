import { Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_API_VERSION } from './stripe.config';
import { StripeError } from './stripe.errors';
import { User } from '../../users/entities/users.entity';

interface StripeProduct {
  stripeProduct: Stripe.Product;
  stripeProductPrice: Stripe.Price;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(readonly configService: ConfigService) {
    this.stripe = new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  async createPaymentIntent(
    stripeProductId: string,
  ): Promise<Stripe.PaymentIntent> {
    const product = await this.stripe.products.retrieve(stripeProductId);
    const price = await this.stripe.prices.retrieve(
      product.default_price.toString(),
    );
    return this.stripe.paymentIntents.create({
      payment_method_types: ['card'],
      amount: price.unit_amount,
      currency: price.currency,
      metadata: {
        stripeProductId,
      },
    });
  }

  async retrieveProductAndPrice(productId: string): Promise<StripeProduct> {
    try {
      const product: Stripe.Product =
        await this.stripe.products.retrieve(productId);
      const price: Stripe.Price = await this.stripe.prices.retrieve(
        product.default_price.toString(),
      );
      return { stripeProduct: product, stripeProductPrice: price };
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error);
    }
  }

  async retrieveBalanceTransaction(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<Stripe.BalanceTransaction> {
    try {
      const charge = await this.stripe.charges.retrieve(
        paymentIntent.latest_charge.toString(),
      );
      return await this.stripe.balanceTransactions.retrieve(
        charge.balance_transaction.toString(),
      );
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error);
    }
  }

  async verifyAndConstructStripeEvent(
    req: RawBodyRequest<Request>,
    endpoint: 'account' | 'connect',
  ): Promise<Stripe.Event | null> {
    const sig = req.headers['stripe-signature'];

    try {
      const secret =
        endpoint == 'account'
          ? this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
          : this.configService.get<string>('STRIPE_WEBHOOK_CONNECT_SECRET');
      const event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        secret,
      );
      return event;
    } catch (err) {
      throw new StripeError(
        StripeError.MESSAGE_SIGNATURE_VERIFICATION_FAILED,
        'Webhook signature verification failed',
      );
    }
  }

  async createProduct(
    priceInCents: number,
    name: string,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<Stripe.Product> {
    try {
      const params: Stripe.ProductCreateParams = {
        name: name,
        default_price_data: {
          currency: currency,
          unit_amount: priceInCents,
        },
        metadata,
      };
      const product = await this.stripe.products.create(params);
      return product;
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error);
    }
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
      } else {
        throw new StripeError();
      }
    }
  }

  async createAccount(user?: User): Promise<Stripe.Account> {
    const params: Stripe.AccountCreateParams = {
      type: 'express',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      country: user?.country,
      business_profile: {
        product_description: 'Creative digital content',
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual',
          },
          debit_negative_balances: false,
        },
      },
    };
    try {
      return await this.stripe.accounts.create(params);
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async createAccountLink(
    connectedAccountId: string,
  ): Promise<Stripe.AccountLink> {
    const frontend = this.configService.get<string>('FRONTEND_URL');
    const params: Stripe.AccountLinkCreateParams = {
      account: connectedAccountId,
      refresh_url: frontend.concat('/user/onboarding'),
      return_url: frontend.concat('/user/onboarded'),
      type: 'account_onboarding',
    };
    try {
      return await this.stripe.accountLinks.create(params);
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async retrieveAccount(connectAccountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(connectAccountId);
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async hasCompletedKYC(connectAccountId: string): Promise<boolean> {
    try {
      const account = await this.stripe.accounts.retrieve(connectAccountId);
      return account.details_submitted;
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async createTransfer(
    params: Stripe.TransferCreateParams,
  ): Promise<Stripe.Transfer> {
    try {
      return await this.stripe.transfers.create(params);
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async createPayout(
    params: Stripe.PayoutCreateParams,
    connectAccountId: string,
  ): Promise<Stripe.Payout> {
    try {
      return await this.stripe.payouts.create(params, {
        stripeAccount: connectAccountId,
      });
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }

  async retrieveAccountBalance(
    connectAccountId: string,
  ): Promise<Stripe.Balance> {
    try {
      return await this.stripe.balance.retrieve(null, {
        stripeAccount: connectAccountId,
      });
    } catch (error) {
      throw new StripeError(StripeError.API_CALL_ERROR, error.toString());
    }
  }
}
