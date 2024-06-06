import { MomentService } from '../../core/moment/moment.service';
import { LootBox } from '../../loot-boxes/entities/loot-box.entity';
import { Field, ObjectType, Int, GraphQLTimestamp } from '@nestjs/graphql';
import { Event as EventPrisma } from '@prisma/client';

@ObjectType()
export class Event {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLTimestamp)
  startDate: Date;

  @Field(() => GraphQLTimestamp)
  endDate: Date;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => [LootBox], { nullable: true })
  lootBoxes?: LootBox[];

  static create(
    eventPrisma: EventPrisma,
    momentService?: MomentService,
  ): Event {
    const event = new Event();
    const moment = momentService?.get();
    event.id = eventPrisma.id;
    event.startDate = moment(eventPrisma.startDate).toDate();
    event.endDate = moment(eventPrisma.endDate).toDate();
    event.name = eventPrisma.name;
    return event;
  }
}
