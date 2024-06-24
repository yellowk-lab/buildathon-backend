import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class LootDistribution {
  @Field(() => String)
  name: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => Int)
  amount: number;
}
