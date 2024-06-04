import {
  Args,
  GraphQLTimestamp,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UserBalance } from './dto/user-balance.dto';
import { UsersService } from '../users/users.service'; // @TEST

@Resolver()
export class PaymentResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private usersService: UsersService, // @TEST
  ) {}

  @UseGuards(JwtAccessGuard)
  @Query(() => String, { name: 'stripeOnboardingUrl' })
  async getOnboardingUrl(@CurrentUser() currentUser: User) {
    return await this.paymentService.startOnboarding(currentUser);
  }

  @UseGuards(JwtAccessGuard)
  @Mutation(() => GraphQLTimestamp)
  async cashoutFunds(@CurrentUser() currentUser: User) {
    return await this.paymentService.initiateCashOut(currentUser);
  }

  @UseGuards(JwtAccessGuard)
  @Query(() => UserBalance, { name: 'userBalance' })
  async getUserBalance(@CurrentUser() currentUser: User) {
    return await this.paymentService.calculateUserBalance(currentUser);
  }

  // @TEST
  @Mutation(() => GraphQLTimestamp)
  async testCashout(@Args('userId') userId: string) {
    const user = await this.usersService.findOneById(userId);
    return await this.paymentService.initiateCashOut(user);
  }
}
