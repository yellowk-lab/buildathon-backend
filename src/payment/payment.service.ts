import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeService } from './stripe/stripe.service';
import { MomentService } from '../core/moment/moment.service';
import { PaymentError } from './payment.errors';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PaymentSuccessEvent,
  PAYMENT_SUCCESS,
} from './events/payment-success.event';
import { User } from '../users/entities/users.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { Payout, Transaction, TransactionStatus } from '@prisma/client';
import { UserBalance } from './dto/user-balance.dto';
import { getParamByISO } from 'iso-country-currency';
import { CurrencyConverterService } from './currency-converter/currency-converter.service';
import { PayoutsService } from '../transactions/payouts.service';
import { UsersService } from '../users/users.service';
import config from './payment.config';
import { PayoutStatus } from '../transactions/payouts.enum';

@Injectable()
export class PaymentService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly transactionsService: TransactionsService,
    private readonly payoutsService: PayoutsService,
    private readonly usersService: UsersService,
    private readonly currencyConverterService: CurrencyConverterService,
    private readonly momentService: MomentService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createPaymentIntent(stripeProductId: string): Promise<string> {
    try {
      const paymentIntent: Stripe.PaymentIntent =
        await this.stripeService.createPaymentIntent(stripeProductId);
      return paymentIntent.client_secret;
    } catch (error) {
      throw new PaymentError(
        PaymentError.PAYMENT_INTENT_CREATION_FAILED,
        `A payment intent could not be created for this product`,
      );
    }
  }

  async processPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    const { stripeProductId } = paymentIntent.metadata;
    if (!stripeProductId) {
      throw new PaymentError(
        PaymentError.MISSING_METADATA,
        'The payment intent is missing metadata',
      );
    }

    const balanceTransaction: Stripe.BalanceTransaction =
      await this.stripeService.retrieveBalanceTransaction(paymentIntent);
    const availableOn = this.momentService
      .get()
      .unix(balanceTransaction.available_on)
      .toDate();

    const paymentSuccessEvent = new PaymentSuccessEvent(
      paymentIntent.id,
      stripeProductId,
      balanceTransaction.amount,
      balanceTransaction.currency,
      balanceTransaction.fee,
      availableOn,
    );
    this.eventEmitter.emit(PAYMENT_SUCCESS, paymentSuccessEvent);
  }

  async createStripeProduct(
    price: number,
    productName: string,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const product: Stripe.Product = await this.stripeService.createProduct(
      price,
      productName,
      currency,
      metadata,
    );
    return product.id;
  }

  async verifyProductPayment(stripeProductId: string, paymentIntentId: string) {
    const paymentIntent =
      await this.stripeService.retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new PaymentError(
        PaymentError.PAYMENT_NOT_SUCCEEDED,
        'The payment has not been made',
      );
    } else if (paymentIntent.metadata.stripeProductId !== stripeProductId) {
      throw new PaymentError(
        PaymentError.PRODUCT_PAYMENT_MISMATCH,
        'The payment is not related to the product',
      );
    }
  }

  async getPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripeService.retrievePaymentIntent(id);
    } catch (error) {
      throw new PaymentError(PaymentError.NOT_FOUND, error);
    }
  }

  async startOnboarding(user: User): Promise<string> {
    if (user.stripeConnectedAccountId) {
      const hasCompletedKYC = await this.stripeService.hasCompletedKYC(
        user.stripeConnectedAccountId,
      );
      if (hasCompletedKYC) {
        throw new PaymentError(
          PaymentError.SERVER_CODES.BAD_REQUEST,
          'User already onboarded',
        );
      } else {
        const accountLink = await this.stripeService.createAccountLink(
          user.stripeConnectedAccountId,
        );
        return accountLink.url;
      }
    }
    const account = await this.stripeService.createAccount(user);
    await this.usersService.update(
      { id: user.id },
      { stripeConnectedAccountId: account.id },
    );
    const accountLink = await this.stripeService.createAccountLink(account.id);
    return accountLink.url;
  }

  async initiateCashOut(user: User): Promise<Date> {
    if (!user.stripeConnectedAccountId) {
      throw new PaymentError(
        PaymentError.NO_STRIPE_ACCOUNT,
        'User has no stripe connected account',
      );
    }
    const hasCompletedKYC = await this.stripeService.hasCompletedKYC(
      user.stripeConnectedAccountId,
    );
    if (!hasCompletedKYC) {
      throw new PaymentError(
        PaymentError.KYC_NOT_COMPLETED,
        'KYC must be complete in order to cashout',
      );
    }
    const moment = this.momentService.get();
    const { payout, transferAmount, transferIds, awaitingPayoutIds } =
      await this.transactionsService.processUserPayout(user.id);
    if (payout) {
      try {
        if (transferAmount > 0) {
          const stripeTransfer: Stripe.Transfer =
            await this.stripeService.createTransfer({
              destination: user.stripeConnectedAccountId,
              amount: payout.amount,
              currency: payout.currency,
              metadata: {
                internalTxIds: transferIds.toString(),
              },
            });
          if (stripeTransfer) {
            await this.transactionsService.updateStatusOf(
              TransactionStatus.AwaitingPayout,
              transferIds,
            );
          }
        }

        const accountBalance: Stripe.Balance =
          await this.stripeService.retrieveAccountBalance(
            user.stripeConnectedAccountId,
          );
        const { available } = accountBalance;
        if (available.length > 0 && available[0].amount > 0) {
          const payoutTxIds = transferIds
            .toString()
            .concat(awaitingPayoutIds.toString());
          const stripePayout: Stripe.Payout =
            await this.stripeService.createPayout(
              {
                method: 'standard',
                amount: available[0].amount,
                currency: available[0].currency,
                metadata: {
                  internalPayoutId: payout.id,
                  internalTxIds: payoutTxIds.toString(),
                },
              },
              user.stripeConnectedAccountId,
            );
          if (stripePayout) {
            await this.payoutsService.update(
              { id: payout.id },
              {
                stripePayoutId: stripePayout.id,
                status: PayoutStatus[stripePayout.status],
              },
            );
            return moment(stripePayout.arrival_date).toDate();
          }
        }
      } catch (error) {
        throw new PaymentError(
          PaymentError.SERVER_CODES.INTERNAL_SERVER_ERROR,
          JSON.stringify(error),
        );
      }
    } else {
      throw new PaymentError(
        PaymentError.NO_FUNDS_TO_CASHOUT,
        'There is currently no fund to cashout for this user',
      );
    }
  }

  async calculateUserBalance(user: User): Promise<UserBalance> {
    const txsPayableNow =
      await this.transactionsService.getEligibleForPayoutNow(user.id);
    const txsPayableLater =
      await this.transactionsService.getUpcomingEligibleForPayout(user.id);

    let currentPayableAmount =
      this.transactionsService.calculateTotalAmount(txsPayableNow);
    let futurePayableAmount =
      this.transactionsService.calculateTotalAmount(txsPayableLater);
    let stripeFees =
      currentPayableAmount > 0
        ? Math.round(
            currentPayableAmount * config.stripe.expressFees.percentage +
              config.stripe.expressFees.fix,
          )
        : 0;

    const currency =
      user.country == 'CH'
        ? CurrencyConverterService.DEFAULT_CURRENCY
        : getParamByISO(user.country, 'currency');
    if (currency !== CurrencyConverterService.DEFAULT_CURRENCY) {
      const rates = await this.currencyConverterService.getRates([
        CurrencyConverterService.DEFAULT_CURRENCY,
        currency,
      ]);
      currentPayableAmount =
        this.currencyConverterService.convertCHFToOtherCurrency(
          currentPayableAmount,
          currency,
          rates,
        );
      futurePayableAmount =
        this.currencyConverterService.convertCHFToOtherCurrency(
          futurePayableAmount,
          currency,
          rates,
        );
      stripeFees = this.currencyConverterService.convertCHFToOtherCurrency(
        stripeFees,
        currency,
        rates,
      );
    }
    if (user.stripeConnectedAccountId) {
      const userStripeBalance: Stripe.Balance =
        await this.stripeService.retrieveAccountBalance(
          user.stripeConnectedAccountId,
        );
      if (
        userStripeBalance?.available?.length > 0 &&
        userStripeBalance?.available[0].amount
      ) {
        currentPayableAmount += Math.round(
          userStripeBalance.available[0].amount,
        );
      }
    }

    const totalAmountPayable = futurePayableAmount + currentPayableAmount;
    return new UserBalance(
      totalAmountPayable,
      currentPayableAmount,
      futurePayableAmount,
      stripeFees,
      currency,
    );
  }

  async handlePayoutUpdates(payoutObject: Stripe.Payout) {
    const { metadata, status } = payoutObject;
    const payout: Payout = await this.payoutsService.findUnique({
      id: metadata?.internalPayoutId,
    });
    if (payout) {
      let txStatus: TransactionStatus;
      if (status == PayoutStatus.paid.toLowerCase()) {
        txStatus = TransactionStatus.Processed;
      } else if (
        status == PayoutStatus.failed.toLowerCase() ||
        status == PayoutStatus.canceled.toLowerCase()
      ) {
        txStatus = TransactionStatus.Failed;
      } else if (status == PayoutStatus.in_transit.toLowerCase()) {
        txStatus = TransactionStatus.InProgress;
      } else {
        txStatus = TransactionStatus.Pending;
      }
      const updatedPayout = await this.payoutsService.update(
        { id: payout.id },
        {
          status: PayoutStatus[status],
        },
      );
      const txIds = metadata.internalTxIds.split(',');
      await this.transactionsService.updateStatusOf(txStatus, txIds);
    }
  }
}
