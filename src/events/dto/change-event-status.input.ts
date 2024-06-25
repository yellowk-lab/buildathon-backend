import { Field, ID, InputType } from '@nestjs/graphql';
import { EventStatus } from '../events.enum';

@InputType()
export class ChangeEventStatusInput {
  @Field(() => ID)
  eventId: string;

  @Field(() => EventStatus)
  newStatus: EventStatus;
}
