import { Field, ID, InputType } from '@nestjs/graphql';
import { EventStatus } from '../events.enums';

@InputType()
export class ChangeEventStatusInput {
  @Field(() => ID)
  eventId: string;

  @Field(() => EventStatus)
  newStatus: EventStatus;
}
