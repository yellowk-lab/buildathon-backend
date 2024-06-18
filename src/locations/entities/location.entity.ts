import { ObjectType, Field, Float, ID } from '@nestjs/graphql';
import { Location as LocationPrisma } from '@prisma/client';

@ObjectType()
export class Location {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float)
  latitude: number;

  constructor(id: string, longitude: number, latitude: number) {
    this.id = id;
    this.longitude = longitude;
    this.latitude = latitude;
  }

  static create(location: LocationPrisma): Location {
    return new Location(location.id, location.longitude, location.latitude);
  }
}
