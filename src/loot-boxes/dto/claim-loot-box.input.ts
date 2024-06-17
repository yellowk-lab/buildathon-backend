import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsUUID } from 'class-validator';

@InputType()
export class ClaimLootBoxInput {
  @IsEmail()
  @Field(() => String)
  email: string;

  @Field(() => String)
  address: string;

  @IsUUID()
  @Field(() => String)
  lootBoxId: string;
}
