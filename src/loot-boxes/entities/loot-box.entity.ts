import { Field, ObjectType, GraphQLTimestamp, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Loot } from './loot.entity';
import { Event } from '../../events/entities/event.entity';
import { LootBox as LootBoxPrisma } from '@prisma/client';
import { Location } from '@module/locations/entities/location.entity';

@ObjectType()
export class LootBox {
  id: string;

  @Field(() => Boolean)
  lootClaimed: boolean;

  @Field(() => GraphQLTimestamp, { nullable: true })
  dateOpened?: Date;

  lootId?: string;

  loot?: Loot;

  claimedById?: string;

  @Field(() => User, { nullable: true })
  claimedBy?: User;

  @Field(() => String, { nullable: true })
  lootNftId?: string;

  eventId: string;

  @Field(() => Event, { nullable: true })
  event?: Event;

  locationId?: string;

  @Field(() => Location, { nullable: true })
  location?: Location;

  constructor(
    id: string,
    eventId: string,
    claimedById?: string,
    lootId?: string,
    locationId?: string,
    openedAt?: Date,
    lootNftId?: string,
  ) {
    this.id = id;
    this.eventId = eventId;
    this.claimedById = claimedById;
    this.lootId = lootId;
    this.locationId = locationId;
    this.dateOpened = openedAt;
    this.lootNftId = lootNftId;
  }

  static create(lootBox: LootBoxPrisma): LootBox {
    return new LootBox(
      lootBox.id,
      lootBox.eventId,
      lootBox.claimedById,
      lootBox.lootId,
      lootBox.locationId,
      lootBox.dateOpened,
      lootBox.lootNftId,
    );
  }
}
