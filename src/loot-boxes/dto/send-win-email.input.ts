import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class SendWinEmailInput {
  @IsEmail()
  @Field(() => String)
  email: string;

  @Field(() => String)
  lootName: string;

  @Field(() => String)
  eventId: string;

  @Field(() => String)
  password: string;
}
