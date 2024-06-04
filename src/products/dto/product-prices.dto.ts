import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductPrices {
  @Field(() => Int)
  finalPrice: number;

  @Field(() => Int)
  creatorPrice: number;
}
