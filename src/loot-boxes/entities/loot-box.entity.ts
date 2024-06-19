import { Field, ObjectType, GraphQLTimestamp, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Loot } from './loot.entity';
import { Event } from '../../events/entities/event.entity';
import { LootBox as LootBoxPrisma } from '@prisma/client';
import { Location } from '@module/locations/entities/location.entity';

@ObjectType()
export class LootBox {
  @Field(() => ID)
  id: string;

  @Field(() => Boolean)
  lootClaimed: boolean;

  @Field(() => GraphQLTimestamp, { nullable: true })
  dateOpened?: Date;

  lootId?: string;

  loot?: Loot;

  openedById?: string;

  @Field(() => User, { nullable: true })
  openedBy?: User;

  eventId: string;

  @Field(() => Event, { nullable: true })
  event?: Event;

  locationId: string;

  @Field(() => Location, { nullable: true })
  location: Location;

  constructor(
    id: string,
    lootClaimed: boolean,
    eventId: string,
    openedById?: string,
    lootId?: string,
    openedAt?: Date,
  ) {
    this.id = id;
    this.lootClaimed = lootClaimed;
    this.eventId = eventId;
    this.openedById = openedById;
    this.lootId = lootId;
    this.dateOpened = openedAt;
  }

  static create(lootBox: LootBoxPrisma): LootBox {
    return new LootBox(
      lootBox.id,
      lootBox.lootClaimed,
      lootBox.eventId,
      lootBox.openedById,
      lootBox.lootId,
      lootBox.dateOpened,
    );
  }
}
