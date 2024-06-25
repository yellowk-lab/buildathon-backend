import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeliveryAddressInput {
  @Field(() => String)
  street: string;

  @Field(() => String)
  city: string;

  @Field(() => String)
  zipCode: string;

  @Field(() => String)
  country: string;
}
