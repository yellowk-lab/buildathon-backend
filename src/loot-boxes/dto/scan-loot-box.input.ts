import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, IsString } from 'class-validator';

@InputType()
export class ScanLootBoxInput {
  @IsString()
  @Field(() => String)
  hash: string;

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
