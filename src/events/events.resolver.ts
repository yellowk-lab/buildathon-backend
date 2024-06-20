import {
  Resolver,
  Query,
  Args,
  Mutation,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { CreateEventInput } from './dto/create-event.input';
import { EventsError } from './events.error';
import { ConfigService } from '@nestjs/config';
import { LootBox } from '@module/loot-boxes/entities/loot-box.entity';
import { LootBoxesService } from '@module/loot-boxes/loot-boxes.service';
import { ChangeEventStatusInput } from './dto/change-event-status.input';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Resolver(() => Event)
export class EventsResolver {
  constructor(
    private readonly eventsService: EventsService,
    private readonly lootBoxServices: LootBoxesService,
    readonly configService: ConfigService,
  ) {}

  @Mutation(() => Event)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @Args('password') password: string,
  ) {
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new EventsError(
        EventsError.FORBIDDEN,
        'Access denied: Wrong password',
      );
    }

    return await this.eventsService.createEvent(input);
  }

  @Mutation(() => Event, { name: 'changeEventStatus' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateEventStatus(
    @Args('input') input: ChangeEventStatusInput,
    @Args('password') password: string,
  ) {
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new EventsError(
        EventsError.FORBIDDEN,
        'Access denied: Wrong password',
      );
    }
    const { eventId, newStatus } = input;
    return await this.eventsService.setEventStatus(eventId, newStatus);
  }

  @Query(() => [Event], { name: 'events' })
  async getEvents() {
    return await this.eventsService.getActiveEvents();
  }

  @ResolveField('lootBoxes', () => [LootBox], { nullable: true })
  async getLoot(@Parent() event: Event) {
    const { id } = event;
    return await this.lootBoxServices.findManyByEventId(id);
  }
}
