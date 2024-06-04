import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReferralFeeConfig,
  PlatformFeeConfig,
  Prisma,
  User,
} from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}
  static DEFAULT_PLATFORM_FEE = 20;
  static DEFAULT_REFERRAL_FEE = 10;

  async findUniqueReferralFee(
    feeWhereUniqueInput: Prisma.ReferralFeeConfigWhereUniqueInput,
    includeOptions?: Prisma.ReferralFeeConfigInclude,
  ): Promise<ReferralFeeConfig> {
    return await this.prisma.referralFeeConfig.findUnique({
      where: feeWhereUniqueInput,
      include: includeOptions,
    });
  }

  async findFirstPlatformFee(): Promise<PlatformFeeConfig> {
    return await this.prisma.platformFeeConfig.findFirst();
  }

  async findFirstReferralFee(): Promise<ReferralFeeConfig> {
    return await this.prisma.referralFeeConfig.findFirst();
  }

  async getDefaultPlatformFees(): Promise<number> {
    const platformFee = await this.findFirstPlatformFee();
    return platformFee
      ? platformFee.percentage
      : FeesService.DEFAULT_PLATFORM_FEE;
  }

  async getReferralFeeById(feeId: string): Promise<number> {
    const referralFeeConfig = await this.findUniqueReferralFee({ id: feeId });
    return referralFeeConfig
      ? referralFeeConfig.percentage
      : FeesService.DEFAULT_REFERRAL_FEE;
  }

  computeFees(amount: number, fees: number): number {
    return Math.round((amount * fees) / 100);
  }

  async calculateAmounts(amount: number, creator: User, stripeFees: number) {
    let platformAmount,
      referrerAmount = 0,
      referrerFees = 0;

    const platformFees = await this.getDefaultPlatformFees();
    const maximumFeesAmount = this.computeFees(amount, platformFees);

    const creatorAmount = amount - maximumFeesAmount;
    platformAmount = maximumFeesAmount - stripeFees;

    if (creator.referrerId) {
      referrerFees = await this.getReferralFeeById(creator.referrerFeeId);
      referrerAmount =
        referrerFees > 0 ? (platformAmount * referrerFees) / platformFees : 0;
      platformAmount = platformAmount - referrerAmount;
    }

    return { creatorAmount, platformAmount, referrerAmount };
  }
}
