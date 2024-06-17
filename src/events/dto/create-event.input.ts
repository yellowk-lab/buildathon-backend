import { Field, GraphQLTimestamp, InputType, Int } from '@nestjs/graphql';
import { LootDistribution } from './loot-distribution.input';
import { EventStatus } from '../entities/event.entity';

@InputType()
export class CreateEventInput {
  @Field(() => String)
  brand: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => GraphQLTimestamp)
  startDate: Date;

  @Field(() => GraphQLTimestamp)
  endDate: Date;

  @Field(() => [LootDistribution])
  lootsDistribution: LootDistribution[];

  @Field(() => Int)
  lootBoxesAmount: number;
}
