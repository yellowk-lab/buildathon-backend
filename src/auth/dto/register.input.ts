import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsISO31661Alpha2,
  IsLowercase,
  IsNotIn,
  IsOptional,
} from 'class-validator';
import config from '../../payment/payment.config';

@InputType()
export default class RegisterInput {
  @Field()
  @IsEmail()
  @IsLowercase()
  email: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  @IsISO31661Alpha2()
  @IsNotIn(config.countries.unavailable, {
    message: 'This country is not supported yet.',
  })
  country: string;

  @Field(() => Boolean)
  tosAccepted: boolean;

  @IsOptional()
  @Field(() => String, { nullable: true })
  referrerCode?: string;
}
