import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { CreateEventInput } from './dto/create-event.input';
import { EventsError } from './events.error';
import { ConfigService } from '@nestjs/config';

@Resolver(() => Event)
export class EventsResolver {
  constructor(
    private readonly eventsService: EventsService,
    readonly configService: ConfigService
  ) {}

  @Mutation(() => Event)
  async createEvent(@Args('createEventInput') data: CreateEventInput) {
    const { startDate, endDate, name, lootsDistribution, password } = data;
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new EventsError(
        EventsError.FORBIDDEN,
        'Access denied: Wrong password'
      );
    }
    const { start, end } = this.eventsService.getVerifiedDates(
      startDate,
      endDate
    );
    return await this.eventsService.createEvent(
      start,
      end,
      lootsDistribution,
      name
    );
  }

  @Query(() => Event)
  async upcomingEvent() {
    return await this.eventsService.getUpcomingEvent();
  }
}
