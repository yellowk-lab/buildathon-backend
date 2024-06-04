import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Transaction, Prisma, TransactionStatus } from '@prisma/client';
import { PayoutsService } from './payouts.service';
import { MomentService } from '../core/moment/moment.service';
import { PayoutStatus } from './payouts.enum';
import { CurrencyConverterService } from '../payment/currency-converter/currency-converter.service';

@Injectable()
export class TransactionsService {
  constructor(
    readonly prisma: PrismaService,
    readonly momentService: MomentService,
    private readonly payoutsService: PayoutsService,
  ) {}

  async create(input: Prisma.TransactionCreateInput): Promise<Transaction> {
    return await this.prisma.transaction.create({
      data: input,
    });
  }

  async findAll(args?: {
    transactionWhereInput?: Prisma.TransactionWhereInput;
    includeOptions?: Prisma.TransactionInclude;
    take?: number;
    skip?: number;
  }): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: args?.transactionWhereInput,
      include: args?.includeOptions,
      take: args?.take,
      skip: args?.skip,
    });
  }

  calculateTotalAmount(txs: Transaction[]): number {
    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
    return total;
  }

  async getEligibleForPayoutNow(userId: string): Promise<Transaction[]> {
    const moment = this.momentService.get();
    return await this.prisma.transaction.findMany({
      where: {
        recipientId: userId,
        status: { in: [TransactionStatus.Pending, TransactionStatus.Failed] },
        payoutId: null,
        availableOn: { lte: moment(Date.now()).toDate() },
        amount: { gt: 0 },
      },
    });
  }

  async processUserPayout(userId: string) {
    const eligibleTxs = await this.getEligibleForPayoutNow(userId);
    const awaitingPayoutTxs = await this.getAwaitingPayout(userId);
    if (eligibleTxs.length > 0 || awaitingPayoutTxs.length > 0) {
      const eligibleTxsAmount = this.calculateTotalAmount(eligibleTxs);
      const awaitingPayoutTxsAmount =
        this.calculateTotalAmount(awaitingPayoutTxs);
      const totalAmount = eligibleTxsAmount + awaitingPayoutTxsAmount;
      const eligibleTxIds = eligibleTxs.map((tx) => tx.id);
      const awaitingTxIds = awaitingPayoutTxs.map((tx) => tx.id);
      const payout = await this.payoutsService.create({
        amount: totalAmount,
        currency: CurrencyConverterService.DEFAULT_CURRENCY,
        status: PayoutStatus.pending,
        recipient: { connect: { id: userId } },
      });
      if (payout) {
        await this.prisma.transaction.updateMany({
          where: { id: { in: eligibleTxIds } },
          data: {
            payoutId: payout.id,
            status: TransactionStatus.InProgress,
          },
        });
        await this.prisma.transaction.updateMany({
          where: { id: { in: awaitingTxIds } },
          data: {
            payoutId: payout.id,
          },
        });

        return {
          payout: payout,
          transferAmount: eligibleTxsAmount,
          transferIds: eligibleTxIds,
          awaitingPayoutIds: awaitingTxIds,
        };
      }
    } else {
      return {
        payout: null,
        transferAmount: 0,
        transferIds: [],
        awaitingPayoutIds: [],
      };
    }
  }

  async getUpcomingEligibleForPayout(userId: string): Promise<Transaction[]> {
    const moment = this.momentService.get();
    return await this.prisma.transaction.findMany({
      where: {
        recipientId: userId,
        status: TransactionStatus.Pending,
        payoutId: null,
        availableOn: { gt: moment(Date.now()).toDate() },
        amount: { gt: 0 },
      },
    });
  }

  async updateStatusOf(
    status: TransactionStatus,
    txIds: string[],
  ): Promise<number> {
    const updateTxs = await this.prisma.transaction.updateMany({
      where: { id: { in: txIds } },
      data: { status },
    });
    return updateTxs.count;
  }

  async getAwaitingPayout(userId: string): Promise<Transaction[]> {
    const moment = this.momentService.get();
    return await this.prisma.transaction.findMany({
      where: {
        recipientId: userId,
        status: TransactionStatus.AwaitingPayout,
        payoutId: null,
        availableOn: { lte: moment(Date.now()).toDate() },
        amount: { gt: 0 },
      },
    });
  }
}
