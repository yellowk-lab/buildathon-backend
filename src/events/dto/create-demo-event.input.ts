import { Field, InputType, Float } from '@nestjs/graphql';
import { CreateEventInput } from './create-event.input';
import { IsNumber } from 'class-validator';

@InputType()
export class CreateDemoEventInput extends CreateEventInput {
  @IsNumber({ allowNaN: false }, { message: 'Must be a valid latitude number' })
  @Field(() => Float)
  latitude: number;

  @IsNumber(
    { allowNaN: false },
    { message: 'Must be a valid longitude number' },
  )
  @Field(() => Float)
  longitude: number;
}
