import { PrismaService } from '../prisma/prisma.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Event } from './entities/event.entity';
import { EventsError, EventsFieldsError } from './events.error';
import { MomentService } from '../core/moment/moment.service';
import { Moment } from 'moment-timezone';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { CreateEventInput } from './dto/create-event.input';

@Injectable()
export class EventsService {
  constructor(
    readonly prisma: PrismaService,
    private readonly momentService: MomentService,
    @Inject(forwardRef(() => LootBoxesService))
    private readonly lootBoxesService: LootBoxesService,
    private readonly lootsService: LootsService,
  ) {}

  async findOneById(id: string): Promise<Event> {
    try {
      const event = await this.prisma.event.findUniqueOrThrow({
        where: { id },
      });
      return Event.create(event, this.momentService);
    } catch (error) {
      throw new EventsError(EventsError.NOT_FOUND, 'Event not found');
    }
  }

  async getOneById(id: string): Promise<Event | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async getActiveEvents() {
    const now = this.momentService.get();
    try {
      const events = await this.prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gt: now().toDate(),
          },
          startDate: {
            lt: now().toDate(),
          },
        },
      });
      return events.map((e) => Event.create(e, this.momentService));
    } catch (error) {
      throw new EventsError(
        EventsError.NOT_FOUND,
        'There are no active events at the moment.',
      );
    }
  }

  async createEvent(input: CreateEventInput): Promise<Event> {
    const {
      brand,
      name,
      description,
      startDate,
      endDate,
      lootsDistribution,
      lootBoxesAmount,
    } = input;
    const totalAmountOfLoots = lootsDistribution.reduce(
      (a, b) => a + b.amount,
      0,
    );

    if (lootBoxesAmount < totalAmountOfLoots) {
      throw Error(
        'EventService: Amount of lootboxes to create must be greater or equal to the available loots.',
      );
    }

    const { start, end } = this.getVerifiedDates(startDate, endDate);
    const event = await this.prisma.event.create({
      data: {
        brand: brand,
        name: name,
        description: description,
        startDate: start.toDate(),
        endDate: end.toDate(),
      },
    });

    const createdLootBoxes = await this.lootBoxesService.createLootBoxes(
      event.id,
      lootBoxesAmount,
    );
    const createdLoots = await this.lootsService.createLoots(lootsDistribution);

    await this.lootBoxesService.assignLootsToLootBoxes(
      createdLootBoxes,
      createdLoots,
    );

    return Event.create(event, this.momentService);
  }

  getVerifiedDates(
    startDate: Date,
    endDate: Date,
  ): { start: Moment; end: Moment } {
    const moment = this.momentService.get();
    const start = moment(startDate);
    const end = moment(endDate);
    if (!start.isValid()) {
      throw new EventsFieldsError(
        EventsFieldsError.SERVER_CODES.BAD_USER_INPUT,
        'Date input format is invalid',
        { startDate: 'Invalid format' },
      );
    }
    if (!end.isValid()) {
      throw new EventsFieldsError(
        EventsFieldsError.SERVER_CODES.BAD_USER_INPUT,
        'Date input format is invalid',
        { endDate: 'Invalid format' },
      );
    }
    if (start.isSameOrAfter(end)) {
      throw new EventsFieldsError(
        EventsFieldsError.DATE_CODES_ERRORS.INVALIDE_DATE_RANGE,
        'Date range is invalid',
        {
          startDate: 'Cannot be same or after end date',
          endDate: 'Cannot be same or before start date',
        },
      );
    }
    return { start, end };
  }

  async getEventName(id: string): Promise<string> {
    const { name } = await this.prisma.event.findUnique({
      where: { id },
      select: { name: true },
    });
    return name;
  }
}
