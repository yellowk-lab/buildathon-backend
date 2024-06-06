import { Field, ObjectType, Int, GraphQLTimestamp, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Loot } from './loot.entity';
import { Event } from '../../events/entities/event.entity';
import { QRCode } from '../../qr-codes/entities/qr-code.entity';
import { LootBox as LootBoxPrisma, Event as EventPrisma } from '@prisma/client';

@ObjectType()
export class LootBox {
  @Field(() => ID)
  id: string;

  @Field(() => Boolean)
  isOpened: boolean;

  @Field(() => GraphQLTimestamp, { nullable: true })
  dateOpened?: Date;

  @Field(() => Int, { nullable: true })
  lootId?: number;

  @Field(() => Loot, { nullable: true })
  loot?: Loot;

  @Field(() => Int, { nullable: true })
  openedById?: number;

  @Field(() => User, { nullable: true })
  openedBy?: User;

  @Field(() => Int)
  eventId: number;

  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field(() => Int, { nullable: true })
  qrCodeId?: number;

  @Field(() => QRCode, { nullable: true })
  qrCode?: QRCode;

  constructor(
    id: string,
    isOpened: boolean,
    eventId: number,
    qrCodeId?: number,
    openedById?: number,
    lootId?: number,
    openedAt?: Date,
  ) {
    this.id = id;
    this.isOpened = isOpened;
    this.eventId = eventId;
    this.qrCodeId = qrCodeId;
    this.openedById = openedById;
    this.lootId = lootId;
    this.dateOpened = openedAt;
  }

  static create(lootBox: LootBoxPrisma): LootBox {
    return new LootBox(
      lootBox.id,
      lootBox.isOpened,
      lootBox.eventId,
      lootBox.qrCodeId,
      lootBox.openedById,
      lootBox.lootId,
      lootBox.dateOpened,
    );
  }
}
