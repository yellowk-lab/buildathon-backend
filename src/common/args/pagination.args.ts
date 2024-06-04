import { Field, Int, ArgsType } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 100 })
  take: number;

  @Field(() => Int, { defaultValue: 0 })
  skip: number;
}
