import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User as UserPrisma } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => ID, { description: 'unique identifier' })
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => String)
  country: string;

  @Field(() => String)
  referralCode: string;

  tosAccepted: boolean;
  stripeConnectedAccountId: string;

  static create(userPrisma: UserPrisma): User {
    const user = new User();
    user.id = userPrisma.id;
    user.email = userPrisma.email;
    user.firstName = userPrisma.firstName;
    user.country = userPrisma.country;
    user.tosAccepted = userPrisma.tosAccepted;
    user.referralCode = userPrisma.referralCode;
    user.stripeConnectedAccountId = userPrisma.stripeConnectedAccountId;
    return user;
  }
}
