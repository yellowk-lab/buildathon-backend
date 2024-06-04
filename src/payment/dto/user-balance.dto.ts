import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserBalance {
  @Field(() => Int)
  totalAmountPayable: number;

  @Field(() => Int)
  currentPayableAmount: number;

  @Field(() => Int)
  futurePayableAmount: number;

  @Field(() => Int)
  stripeFees: number;

  @Field(() => String)
  currency: string;

  constructor(
    totalAmountPayable: number,
    currentPayableAmount: number,
    futurePayableAmount: number,
    stripeFees: number,
    currency: string,
  ) {
    this.totalAmountPayable = totalAmountPayable;
    this.currentPayableAmount = currentPayableAmount;
    this.futurePayableAmount = futurePayableAmount;
    this.stripeFees = stripeFees;
    this.currency = currency;
  }
}
