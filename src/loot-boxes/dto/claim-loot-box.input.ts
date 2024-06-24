import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEthereumAddress, IsUUID } from 'class-validator';

@InputType()
export class ClaimLootBoxInput {
  @IsEmail()
  @Field(() => String)
  email: string;

  @IsEthereumAddress()
  @Field(() => String)
  address: string;

  @IsUUID()
  @Field(() => String)
  lootBoxId: string;
}
