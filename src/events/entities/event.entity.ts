import { MomentService } from '../../core/moment/moment.service';
import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { Field, ObjectType, GraphQLTimestamp, ID } from '@nestjs/graphql';
import {
  Event as EventPrisma,
  EventStatus as PrismaEventStatus,
} from '@prisma/client';

export type EventStatus = PrismaEventStatus;

@ObjectType()
export class Event {
  @Field(() => ID)
  id: string;

  @Field(() => GraphQLTimestamp)
  startDate: Date;

  @Field(() => GraphQLTimestamp)
  endDate: Date;

  @Field(() => String)
  brand: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  status: EventStatus;

  @Field(() => [LootBox], { nullable: true })
  lootBoxes?: LootBox[];

  static create(
    eventPrisma: EventPrisma,
    momentService?: MomentService,
  ): Event {
    const event = new Event();
    const moment = momentService?.get();
    event.id = eventPrisma.id;
    event.name = eventPrisma.name;
    event.brand = eventPrisma.brand;
    event.description = eventPrisma.description;
    event.status = eventPrisma.status;
    event.startDate = moment(eventPrisma.startDate).toDate();
    event.endDate = moment(eventPrisma.endDate).toDate();
    return event;
  }
}
