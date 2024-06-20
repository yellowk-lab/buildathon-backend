import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { LootBox } from './entities/loot-box.entity';
import { MomentService } from '../core/moment/moment.service';
import {
  GeographicCoordinate,
  calculateDistance,
} from '../common/utils/geolocalisation.util';
import { LootBoxesError } from './loot-boxes.error';
import { LootsService } from './loots/loots.service';
import { shuffleArray } from '@module/common/utils/shuffle.util';
import { Loot } from './entities/loot.entity';
import { Web3Service } from '../web3/web3.service';
import { EventsService } from '../events/events.service';
import { formatStringToSlug } from '../common/utils/string.util';

@Injectable()
export class LootBoxesService {
  constructor(
    readonly prisma: PrismaService,
    private emailService: MailService,
    private lootsService: LootsService,
    private configService: ConfigService,
    private momentService: MomentService,
    private web3Service: Web3Service,
    private eventsService: EventsService,
  ) {}

  private maximalDistanceToScan =
    this.configService.get<number>('SCAN_PERIMETER_KM');

  async createLootBoxes(eventId: string, amount: number): Promise<LootBox[]> {
    const createdLootBoxes = await this.prisma.lootBox.createManyAndReturn({
      data: Array(amount)
        .fill(0)
        .map(() => ({
          eventId: eventId,
        })),
    });
    return createdLootBoxes.map(LootBox.create);
  }

  async assignLootsToLootBoxes(
    lootBoxes: LootBox[],
    loots: Loot[],
  ): Promise<void> {
    const flattenedLoots = loots.flatMap((loot) =>
      Array(loot.totalSupply).fill(loot.id),
    );
    const shuffledLootBoxes = shuffleArray(lootBoxes);
    const shuffledLoots = shuffleArray(flattenedLoots);

    await Promise.all(
      shuffledLootBoxes.map(async (lootBox, index) => {
        if (index < shuffledLoots.length) {
          await this.prisma.lootBox.update({
            where: { id: lootBox.id },
            data: { lootId: shuffledLoots[index] },
          });
        }
      }),
    );
  }

  async claimLootBox(
    email: string,
    address: string,
    lootBoxId: string,
  ): Promise<LootBox> {
    const lootBox = await this.findOneById(lootBoxId);

    if (!lootBox.lootId) {
      throw new LootBoxesError(
        LootBoxesError.NO_LOOT_TO_CLAIM,
        'This loot box does not contain any loot to claim',
      );
    }
    if (lootBox.lootClaimed) {
      throw new LootBoxesError(
        LootBoxesError.ALREADY_CLAIMED,
        'This loot box has already been claimed',
      );
    }

    const loot = await this.lootsService.findOneById(lootBox.lootId);
    const eventBrand = await this.eventsService.getEventBrand(lootBox.eventId);
    const brandRepoSlug = formatStringToSlug(eventBrand);
    const tokenURI = this.configService
      .get<string>('DOS_CDN')
      .concat('/', brandRepoSlug, '/', loot.name, '.json');
    await this.lootsService.decreaseCirculatingSupplyByOne(lootBox.lootId);
    const claimedLootBox = await this.setAndCreateWinner(lootBoxId, email);
    const nftHasBeenMinted = await this.web3Service.mintNFT(address, tokenURI);
    const emailHasBeenSent = await this.emailService.sendWinnerConfirmation(
      email,
      loot.imageUrl,
      loot.displayName,
    );
    if (!emailHasBeenSent) {
      console.log('Mail not send');
    }
    if (!nftHasBeenMinted) {
      console.log('NFT not minted');
    }

    return claimedLootBox;
  }

  isScanCloseToLootBox(
    scanPosition: GeographicCoordinate,
    lootBoxPosition: GeographicCoordinate,
  ): boolean {
    return (
      calculateDistance(scanPosition, lootBoxPosition) <=
      this.maximalDistanceToScan
    );
  }

  async hasBeenScanned(lootBoxId: string): Promise<boolean> {
    const lootBox = await this.prisma.lootBox.findFirst({
      where: {
        id: lootBoxId,
        lootClaimed: true,
        dateOpened: { not: null },
        locationId: { not: null },
      },
    });
    return Boolean(lootBox);
  }

  async setAndCreateWinner(
    lootBoxId: string,
    userEmail: string,
  ): Promise<LootBox> {
    const moment = this.momentService.get();
    const dateOpened = moment(Date.now()).toDate();
    const updatedLootBox = await this.prisma.lootBox.update({
      where: { id: lootBoxId },
      data: {
        lootClaimed: true,
        dateOpened,
        openedBy: {
          connectOrCreate: {
            where: { email: userEmail },
            create: { email: userEmail },
          },
        },
      },
    });
    return LootBox.create(updatedLootBox);
  }

  async getLootBoxWithinRange(
    lootBoxId: string,
    coordinates: GeographicCoordinate,
  ): Promise<LootBox> {
    const lootBox = await this.prisma.lootBox.findUnique({
      where: { id: lootBoxId },
      include: { location: true },
    });
    if (!lootBox) {
      throw new LootBoxesError(LootBoxesError.NOT_FOUND, 'LootBox not found');
    }
    const { location } = lootBox;
    if (!location) {
      throw new LootBoxesError(
        LootBoxesError.LOCATION_MISSING,
        'This lootbox has no location assigned',
      );
    }
    const lootBoxCoordinates: GeographicCoordinate = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    const isCoordinateCloseEnough = this.isScanCloseToLootBox(
      lootBoxCoordinates,
      coordinates,
    );
    if (isCoordinateCloseEnough) {
      return LootBox.create(lootBox);
    } else {
      throw new LootBoxesError(
        LootBoxesError.NOT_WITHIN_COORDINATES_RANGE,
        'Loot Box scanned not enough close to coordinates',
      );
    }
  }

  async updateScanned(lootBoxId: string): Promise<LootBox> {
    // TODO: Implement this properly to replace old implementation.
    const moment = this.momentService.get();
    const updatedLootBox = await this.prisma.lootBox.update({
      where: { id: lootBoxId },
      data: {
        lootClaimed: true,
        dateOpened: moment(Date.now()).toDate(),
      },
    });
    return LootBox.create(updatedLootBox);
  }

  async findAll(
    filters?: {
      lootClaimed?: boolean;
      dateOpened?: Date;
      lootId?: string;
      openedById?: string;
      eventId?: string;
    },
    include?: {
      loot?: boolean;
      openedBy?: boolean;
      event?: boolean;
    },
    take?: number,
    skip?: number,
  ): Promise<LootBox[]> {
    const lootBoxes = await this.prisma.lootBox.findMany({
      take: take,
      skip: skip,
      where: {
        ...(filters.lootClaimed !== undefined && {
          lootClaimed: filters.lootClaimed,
        }),
        ...(filters.dateOpened !== undefined && {
          dateOpened: filters.dateOpened,
        }),
        ...(filters.lootId !== undefined && { lootId: filters.lootId }),
        ...(filters.openedById !== undefined && {
          openedById: filters.openedById,
        }),
        ...(filters.eventId !== undefined && { eventId: filters.eventId }),
      },
      include,
    });
    return lootBoxes.map(LootBox.create);
  }

  async createLootBox(eventId: string, lootId?: string): Promise<LootBox> {
    const lootBox = await this.prisma.lootBox.create({
      data: { eventId, lootId },
    });
    return LootBox.create(lootBox);
  }

  async sendWinEmail(to: string, lootName: string, eventId: string) {
    // TODO: Implement this properly to send an email based on lootname of a specific event.
    return null;
  }

  async findOneById(id: string): Promise<LootBox> {
    try {
      const lootBox = await this.prisma.lootBox.findUniqueOrThrow({
        where: { id },
      });
      return LootBox.create(lootBox);
    } catch (error) {
      throw new LootBoxesError(LootBoxesError.NOT_FOUND, 'LootBox not found');
    }
  }

  async findManyByEventId(id: string): Promise<LootBox[]> {
    try {
      const lootBoxes = await this.prisma.lootBox.findMany({
        where: {
          eventId: id,
        },
      });
      return lootBoxes.map((lootBox) => LootBox.create(lootBox));
    } catch (error) {}
  }

  async getOneById(id: string): Promise<LootBox | null> {
    try {
      return await this.findOneById(id);
    } catch (error) {
      return null;
    }
  }

  async findClosestToTargetCoordinate(
    targetCoordinate: GeographicCoordinate,
  ): Promise<LootBox | null> {
    // TODO: Implement this properly to replace old implementation.
    return null;
  }

  async assignLocation(
    lootBoxId: string,
    locationId: string,
  ): Promise<LootBox> {
    // TODO: Implement this properly to replace old implementation.
    return null;
  }
}
