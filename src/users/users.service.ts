import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UserError } from './users.errors';
import { secureNameGenerator } from '../common/utils/string.util';
import RegisterInput from '../auth/dto/register.input';
import { FeesService } from '../fees/fees.service';

@Injectable()
export class UsersService {
  constructor(
    readonly prisma: PrismaService,
    private readonly feesService: FeesService,
  ) {}

  async findOneById(id: string): Promise<User> {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      throw new UserError(UserError.NOT_FOUND, 'User not found');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { email: email.toLowerCase() },
      });
    } catch (error) {
      throw new UserError(
        UserError.NOT_FOUND,
        `User not found for email ${email}`,
      );
    }
  }

  async getOneById(id: string): Promise<User | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async findByReferralCode(referralCode: string): Promise<User> {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { referralCode },
      });
    } catch (error) {
      throw new UserError(UserError.NOT_FOUND, 'User not found');
    }
  }

  async generateUniqueReferralCode(): Promise<string> {
    let isHashUnique = false;
    let generatedCode: string = secureNameGenerator(null, 20);
    while (!isHashUnique) {
      const product = await this.prisma.user.findUnique({
        where: { referralCode: generatedCode },
      });
      if (!product) {
        isHashUnique = true;
      } else {
        generatedCode = secureNameGenerator(null, 20);
      }
    }
    return generatedCode;
  }

  async registerWithVerificationAndReferral(
    data: RegisterInput,
  ): Promise<User> {
    const { tosAccepted, referrerCode, country, email, firstName } = data;
    if (!tosAccepted) {
      throw new UserError(
        UserError.USER_CREATION,
        'User must accept terms of services to register',
      );
    }
    let referrerId = null,
      referrerFeeId = null;

    try {
      const referrer = await this.findByReferralCode(referrerCode);
      const referrerFee = await this.feesService.findFirstReferralFee();
      referrerId = referrer.id;
      referrerFeeId = referrerFee.id;
    } finally {
      try {
        const referralCode = await this.generateUniqueReferralCode();
        return await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            firstName,
            country,
            tosAccepted,
            referralCode,
            referrerId,
            referrerFeeId,
          },
        });
      } catch (error) {
        throw new UserError(
          UserError.USER_CREATION,
          `User with email '${email} could not be created.`,
        );
      }
    }
  }

  async findUnique(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    includeOptions?: Prisma.UserInclude,
  ): Promise<User> {
    return await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      include: includeOptions,
    });
  }

  async update(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    updateInput: Prisma.UserUpdateInput,
  ): Promise<User> {
    return await this.prisma.user.update({
      where: userWhereUniqueInput,
      data: updateInput,
    });
  }
}
