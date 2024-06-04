import { InputType, Field, GraphQLTimestamp, Int } from '@nestjs/graphql';
import {
  IsISO4217CurrencyCode,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { IsDateOrTimestamp } from '../../common/validators/date-timestamp.validator';
import config from '../../payment/payment.config';
@InputType()
export class CreateProductInput {
  @Field(() => String)
  fileStorageHash: string;

  @IsInt()
  @Field(() => Int)
  price: number;

  @Field(() => String)
  @IsISO4217CurrencyCode()
  @IsIn(config.currencies.available, {
    message: 'This currency is not supported yet.',
  })
  currency: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  name?: string;

  @IsOptional()
  @IsDateOrTimestamp()
  @Field(() => GraphQLTimestamp, { nullable: true })
  expiresAt?: Date;
}
