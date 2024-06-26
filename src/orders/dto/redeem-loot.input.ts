import { Field, InputType } from '@nestjs/graphql';
import { DeliveryAddressInput } from './delivery-address.input';
import { IsEmail, IsEthereumAddress } from 'class-validator';

@InputType()
export class RedeemLootInput {
  @Field(() => String)
  lootNftId: string;

  @Field(() => String)
  transactionHash: string;

  @IsEmail()
  @Field(() => String)
  email: string;

  @IsEthereumAddress()
  @Field(() => String)
  walletAddress: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => DeliveryAddressInput, { nullable: true })
  deliveryAddress?: DeliveryAddressInput;
}
