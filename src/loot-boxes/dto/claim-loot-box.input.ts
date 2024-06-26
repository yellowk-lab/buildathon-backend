import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsEthereumAddress,
  IsOptional,
  IsUUID,
} from 'class-validator';

@InputType()
export class ClaimLootBoxInput {
  @IsEthereumAddress()
  @Field(() => String)
  address: string;

  @IsUUID()
  @Field(() => String)
  lootBoxId: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  email?: string;
}
