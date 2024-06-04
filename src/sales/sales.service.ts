import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  Product,
  Sale,
  User,
  TransactionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import { FeesService } from '../fees/fees.service';
import { PaymentSuccessEvent } from '../payment/events/payment-success.event';
import { SaleError } from './sales.errors';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly transactionsService: TransactionsService,
    private readonly feesService: FeesService,
  ) {}

  async create(saleInput: Prisma.SaleCreateInput): Promise<Sale> {
    return await this.prisma.sale.create({
      data: saleInput,
    });
  }

  // @TODO
  // The whole process must be syncronized, meaning if one of the component failed, we need to
  // - cancel / remove all transaction registerer AND OR
  // - try again to register what has failed

  // @Dev WARNING: There will be 2 cases in the future:
  // 1) The creator has not done KYC and has no stripe account
  // 2) The creator has already registered with KYC and has a stripe account
  // When option 2, the system should be able to take the fees directly through stripe which changes the cashout mechanisms
  async creationProcess(paymentOutput: PaymentSuccessEvent) {
    const {
      paymentIntentId,
      stripeProductId,
      amount,
      currency,
      availableOn,
      stripeFees,
    } = paymentOutput;
    const product: Product & { creator?: User } =
      await this.productsService.findUnique(
        { stripeProductId },
        { creator: true },
      );

    if (product) {
      const { creator } = product;
      if (creator) {
        const sale = await this.create({
          stripeTransactionId: paymentIntentId,
          amount,
          currency,
          product: { connect: { id: product.id } },
        });

        if (sale) {
          const { creatorAmount, platformAmount, referrerAmount } =
            await this.feesService.calculateAmounts(
              amount,
              creator,
              stripeFees,
            );
          const creatorTxParams: Prisma.TransactionCreateInput = {
            amount: creatorAmount,
            currency,
            availableOn,
            status: TransactionStatus.Pending,
            type: TransactionType.CreatorEarnings,
            recipient: { connect: { id: creator.id } },
            sale: { connect: { id: sale.id } },
          };

          const platformTxParams: Prisma.TransactionCreateInput = {
            amount: platformAmount,
            currency,
            availableOn,
            status: TransactionStatus.Pending,
            type: TransactionType.PlatformFee,
            sale: { connect: { id: sale.id } },
          };
          const creatorTx =
            await this.transactionsService.create(creatorTxParams);
          const platformTx =
            await this.transactionsService.create(platformTxParams);
          if (referrerAmount > 0) {
            const referrerTxParams: Prisma.TransactionCreateInput = {
              amount: referrerAmount,
              currency,
              availableOn,
              status: TransactionStatus.Pending,
              type: TransactionType.ReferralFee,
              recipient: { connect: { id: creator.referrerId } },
              sale: { connect: { id: sale.id } },
            };
            const referrerTx =
              await this.transactionsService.create(referrerTxParams);
          }
        } else {
          // sale creation failed
          throw new SaleError(SaleError.CREATE_FAILED, `Could not create sale`);
        }
      } else {
        // no creator found
        throw new SaleError(
          SaleError.CREATE_FAILED,
          `The product creator does not exist`,
        );
      }
    } else {
      // no product found
      throw new SaleError(
        SaleError.CREATE_FAILED,
        `The product with the stripe id ${stripeProductId} could not be found`,
      );
    }
  }
}
