import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { LootBox } from './entities/loot-box.entity';
import { MomentService } from '../core/moment/moment.service';
import {
  GeographicCoordinate,
  calculateDistance,
} from '../common/utils/geolocalisation.util';
import { QRCode } from '../qr-codes/entities/qr-code.entity';
import { CratesService } from '../crates/crates.service';
import { LootBoxesError } from './loot-boxes.error';
import { EventsService } from '../events/events.service';
import { LootsService } from './loots/loots.service';
import { LootsError } from './loots/loots.error';

@Injectable()
export class LootBoxesService {
  constructor(
    readonly prisma: PrismaService,
    private cratesService: CratesService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    private emailService: MailService,
    private lootsService: LootsService,
    private configService: ConfigService,
    private momentService: MomentService,
  ) {}

  private maximalDistanceToScan =
    this.configService.get<number>('SCAN_PERIMETER_KM');

  async claimLootBox(email: string, lootBoxId: string): Promise<LootBox> {
    const lootBox = await this.prisma.lootBox.findUnique({
      where: { id: lootBoxId },
    });
    if (!lootBox) {
      throw new LootBoxesError(
        LootBoxesError.NOT_FOUND,
        'The loot box can not be found',
      );
    }
    if (lootBox.openedById !== null) {
      throw new LootBoxesError(
        LootBoxesError.ALREADY_CLAIMED,
        'This loot box has already been claimed.',
      );
    }
    const hasBeenFound = await this.hasBeenScanned(lootBoxId);
    if (!hasBeenFound) {
      throw new LootBoxesError(
        LootBoxesError.FORBIDDEN,
        'This lootbox has not been scanned yet and cannot be claimed.',
      );
    }
    const claimedLootBox = await this.setAndCreateWinner(lootBoxId, email);
    const loot = await this.lootsService.getOneById(lootBox.lootId);
    const lootImgUrl =
      this.configService.get<string>('DOS_CDN') + '/' + loot.name + '.png';
    await this.emailService.sendWinnerConfirmation(
      email,
      lootImgUrl,
      loot.displayName,
    );
    return claimedLootBox;
  }

  isScanCloseToCrate(
    scanPosition: GeographicCoordinate,
    cratePosition: GeographicCoordinate,
  ): boolean {
    return (
      calculateDistance(scanPosition, cratePosition) <=
      this.maximalDistanceToScan
    );
  }

  async hasBeenScanned(lootBoxId: string): Promise<boolean> {
    const lootBox = await this.prisma.lootBox.findFirst({
      where: {
        id: lootBoxId,
        isOpened: true,
        dateOpened: { not: null },
        qrCode: { crateId: { not: null } },
      },
    });
    if (lootBox) {
      return true;
    }
    return false;
  }

  async setAndCreateWinner(
    lootBoxId: string,
    userEmail: string,
  ): Promise<LootBox> {
    const updatedLootBox = await this.prisma.lootBox.update({
      where: { id: lootBoxId },
      data: {
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

  async scanAndfoundProcess(
    lootBox: LootBox,
    coordinate: GeographicCoordinate,
    qrCode: QRCode,
  ): Promise<LootBox> {
    const closestCrate =
      await this.cratesService.findClosestToTargetCoordinate(coordinate);
    const cratePosition: GeographicCoordinate = {
      lng: closestCrate.longitude,
      lat: closestCrate.latitude,
    };
    if (!this.isScanCloseToCrate(coordinate, cratePosition)) {
      throw new LootBoxesError(
        LootBoxesError.FORBIDDEN,
        'You must be closed to a QR Code on a crate to scan it: no cheating!',
      );
    }
    if (closestCrate) {
      await this.cratesService.assignQRCode(closestCrate.id, qrCode.id);
      const updatedLootBox = await this.updateScanned(lootBox.id);
      return updatedLootBox;
    } else {
      throw new LootBoxesError(
        LootBoxesError.SERVER_CODES.INTERNAL_SERVER_ERROR,
        'No crate found close to the coordinate',
      );
    }
  }

  async updateScanned(lootBoxId: string): Promise<LootBox> {
    const moment = this.momentService.get();
    const updatedLootBox = await this.prisma.lootBox.update({
      where: { id: lootBoxId },
      data: {
        isOpened: true,
        dateOpened: moment(Date.now()).toDate(),
      },
    });
    return LootBox.create(updatedLootBox);
  }

  async removeUnclaimedLootFromBox(): Promise<number> {
    const unclaimedLootBoxes = await this.prisma.lootBox.groupBy({
      by: ['lootId'],
      where: {
        lootId: { not: null },
        isOpened: false,
      },
      _count: true,
    });

    for (const lootBox of unclaimedLootBoxes) {
      const loot = await this.lootsService.findOneById(lootBox.lootId);
      await this.prisma.lootBox.updateMany({
        where: {
          lootId: lootBox.lootId,
          isOpened: false,
        },
        data: {
          lootId: null,
        },
      });
      await this.lootsService.updateCirculatingSupply(
        lootBox.lootId,
        loot.circulatingSupply + lootBox._count,
      );
    }
    return unclaimedLootBoxes.reduce((prev, curr) => (prev += curr._count), 0);
  }

  async getByQRCodeAndEvent(
    qrCodeId: number,
    eventId: number,
  ): Promise<LootBox | null> {
    try {
      const lootBox = await this.prisma.lootBox.findFirstOrThrow({
        where: { qrCodeId, eventId },
      });
      return LootBox.create(lootBox);
    } catch (error) {
      return null;
    }
  }

  async findAll(
    filters?: {
      isOpened?: boolean;
      dateOpened?: Date;
      lootId?: number;
      openedById?: number;
      eventId?: number;
      qrCodeId?: number;
    },
    include?: {
      loot?: boolean;
      openedBy?: boolean;
      event?: boolean;
      qrCode?: boolean;
    },
    take?: number,
    skip?: number,
  ): Promise<LootBox[]> {
    const lootBoxes = await this.prisma.lootBox.findMany({
      take: take,
      skip: skip,
      where: {
        ...(filters.isOpened !== undefined && { isOpened: filters.isOpened }),
        ...(filters.dateOpened !== undefined && {
          dateOpened: filters.dateOpened,
        }),
        ...(filters.lootId !== undefined && { lootId: filters.lootId }),
        ...(filters.openedById !== undefined && {
          openedById: filters.openedById,
        }),
        ...(filters.eventId !== undefined && { eventId: filters.eventId }),
        ...(filters.qrCodeId !== undefined && { qrCodeId: filters.qrCodeId }),
      },
      include,
    });
    return lootBoxes.map(LootBox.create);
  }

  async createLootBox(
    eventId: number,
    qrCodeId: number,
    lootId?: number,
  ): Promise<LootBox> {
    const lootBox = await this.prisma.lootBox.create({
      data: { eventId, qrCodeId, lootId },
    });
    return LootBox.create(lootBox);
  }

  async sendWinEmail(to: string, lootName: string) {
    const loot = await this.lootsService.getOneByName(lootName);
    if (!loot) {
      throw new LootsError(
        LootsError.NOT_FOUND,
        `No loots found with the name "${lootName}".`,
      );
    }
    const lootImgUrl =
      this.configService.get<string>('DOS_CDN') + '/' + loot.name + '.png';
    await this.emailService.sendWinnerConfirmation(
      to,
      lootImgUrl,
      loot.displayName,
    );
    return `Email sent to ${to} for a ${loot.displayName}.`;
  }
}
