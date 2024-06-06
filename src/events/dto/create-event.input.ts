import { Field, GraphQLTimestamp, InputType, Int } from '@nestjs/graphql';
import { LootDistribution } from './loot-distribution.input';

@InputType()
export class CreateEventInput {
  @Field(() => String)
  password: string;

  @Field(() => GraphQLTimestamp)
  startDate: Date;

  @Field(() => GraphQLTimestamp)
  endDate: Date;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => [LootDistribution])
  lootsDistribution: LootDistribution[];
}
