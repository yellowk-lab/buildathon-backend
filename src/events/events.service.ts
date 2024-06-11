import { PrismaService } from '../prisma/prisma.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Event } from './entities/event.entity';
import { EventsError, EventsFieldsError } from './events.error';
import { MomentService } from '../core/moment/moment.service';
import { Moment } from 'moment-timezone';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { LootDistribution } from './dto/loot-distribution.input';
import { QRCode } from '../qr-codes/entities/qr-code.entity';

@Injectable()
export class EventsService {
  constructor(
    readonly prisma: PrismaService,
    private readonly lootsService: LootsService,
    @Inject(forwardRef(() => LootBoxesService))
    private readonly lootBoxesService: LootBoxesService,
    private readonly qrCodesService: QRCodesService,
    private readonly momentService: MomentService,
  ) {}

  async findOneById(id: number): Promise<Event> {
    try {
      const event = await this.prisma.event.findUniqueOrThrow({
        where: { id },
      });
      return Event.create(event, this.momentService);
    } catch (error) {
      throw new EventsError(EventsError.NOT_FOUND, 'Event not found');
    }
  }

  async getOneById(id: number): Promise<Event | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async getUpcomingEvent(): Promise<Event | null> {
    try {
      const moment = this.momentService.get();
      const now = moment(Date.now()).toDate();
      const event = await this.prisma.event.findFirstOrThrow({
        where: { startDate: { gt: now } },
      });
      return Event.create(event, this.momentService);
    } catch (error) {
      throw new EventsError(
        EventsError.NOT_FOUND,
        'No new events are currently planned.',
      );
    }
  }

  async getOnGoingEvent(): Promise<Event> {
    try {
      const moment = this.momentService.get();
      const now = moment(Date.now()).toDate();
      const event = await this.prisma.event.findFirstOrThrow({
        where: { startDate: { lte: now }, endDate: { gte: now } },
      });
      return Event.create(event, this.momentService);
    } catch (error) {
      throw new EventsError(
        EventsError.NOT_FOUND,
        'There is no ongoing event at the moment',
      );
    }
  }

  async getPastAndFinishedEvents(from?: Moment): Promise<Event[]> {
    const moment = this.momentService.get();
    const now = from ? from : moment(Date.now());
    const pastEvents = await this.prisma.event.findMany({
      where: {
        startDate: { lte: now.toDate() },
        endDate: { lte: now.toDate() },
      },
    });
    return pastEvents.map((e) => Event.create(e, this.momentService));
  }

  async createEvent(
    startDate: Date,
    endDate: Date,
    lootsDistribution: LootDistribution[],
    name?: string,
  ): Promise<Event> {
    const { start, end } = this.getVerifiedDates(startDate, endDate);
    const event = await this.prisma.event.create({
      data: {
        startDate: start.toDate(),
        endDate: end.toDate(),
        name: name,
      },
    });

    let qrCodeIndex = 0;
    const randomizedQrCodes: QRCode[] =
      await this.qrCodesService.getAllShuffled();
    for (const lootItem of lootsDistribution) {
      const loot = await this.lootsService.getOneByName(lootItem.name);
      if (loot) {
        const canBeDistributed =
          await this.lootsService.verifyDistributionAvailability(
            loot,
            lootItem.amount,
          );
        if (canBeDistributed) {
          for (let i = 1; i <= lootItem.amount; i++) {
            await this.lootBoxesService.createLootBox(
              event.id,
              randomizedQrCodes[qrCodeIndex].id,
              loot.id,
            );
            qrCodeIndex++;
          }
          const circulatingSupply =
            await this.lootsService.computeCirculatingSupply(loot);
          await this.lootsService.updateCirculatingSupply(
            loot.id,
            circulatingSupply,
          );
        }
      }
    }

    while (qrCodeIndex < randomizedQrCodes.length) {
      await this.lootBoxesService.createLootBox(
        event.id,
        randomizedQrCodes[qrCodeIndex].id,
      );
      qrCodeIndex++;
    }

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
}
