import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payout, Prisma } from '@prisma/client';

@Injectable()
export class PayoutsService {
  constructor(readonly prisma: PrismaService) {}

  async create(payoutInput: Prisma.PayoutCreateInput): Promise<Payout> {
    return await this.prisma.payout.create({ data: payoutInput });
  }

  async findUnique(
    payoutWhereUniqueInput: Prisma.PayoutWhereUniqueInput,
    includeOptions?: Prisma.PayoutInclude,
  ): Promise<Payout> {
    return await this.prisma.payout.findUnique({
      where: payoutWhereUniqueInput,
      include: includeOptions,
    });
  }

  async update(
    payoutWhereUniqueInput: Prisma.PayoutWhereUniqueInput,
    payoutUpdateInput: Prisma.PayoutUpdateInput,
  ): Promise<Payout> {
    return await this.prisma.payout.update({
      where: payoutWhereUniqueInput,
      data: payoutUpdateInput,
    });
  }
}
