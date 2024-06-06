import {
  Query,
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { LootBoxesService } from './loot-boxes.service';
import { LootBox } from './entities/loot-box.entity';
import { ClaimLootBoxInput } from './dto/claim-loot-box.input';
import { EventsService } from '../events/events.service';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { LootsService } from './loots/loots.service';
import { Loot } from './entities/loot.entity';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ScanQRCodeInput } from './dto/scan-qr-code.input';
import { LootBoxesError, LootBoxesFieldsError } from './loot-boxes.error';
import { GeographicCoordinate } from '../common/utils/geolocalisation.util';
import { isEmail } from '../common/utils/email.util';
import { ConfigService } from '@nestjs/config';
import { SendWinEmailInput } from './dto/send-win-email.input';
import { LootsError } from './loots/loots.error';

@Resolver(() => LootBox)
export class LootBoxesResolver {
  constructor(
    private lootBoxesService: LootBoxesService,
    private lootsService: LootsService,
    private eventsService: EventsService,
    private qrCodesService: QRCodesService,
    private configService: ConfigService
  ) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Mutation(() => LootBox, { name: 'scanLootBoxQRCode' })
  async searchLootBoxFromQRCodeScan(
    @Args('scanInput') scanInput: ScanQRCodeInput
  ) {
    const { latitude, longitude, hash } = scanInput;
    const qrCode = await this.qrCodesService.findUniqueByHash(hash);
    const coordinate: GeographicCoordinate = { lat: latitude, lng: longitude };
    await this.qrCodesService.registerScanEvent(qrCode.id, coordinate);
    const onGoingEvent = await this.eventsService.getOnGoingEvent();
    const lootBox = await this.lootBoxesService.getByQRCodeAndEvent(
      qrCode.id,
      onGoingEvent.id
    );
    if (lootBox) {
      if (lootBox.isOpened) {
        return lootBox;
      } else {
        const updatedLootBox = await this.lootBoxesService.scanAndfoundProcess(
          lootBox,
          coordinate,
          qrCode
        );
        return updatedLootBox;
      }
    } else {
      const emptyLoot = await this.lootBoxesService.createLootBox(
        onGoingEvent.id,
        qrCode.id
      );
      return emptyLoot;
    }
  }

  @Query(() => LootBox, { name: 'lootBoxByHash' })
  async getLootBoxByHash(@Args('hash') hash: string) {
    const qrCode = await this.qrCodesService.findUniqueByHash(hash);
    const onGoingEvent = await this.eventsService.getOnGoingEvent();
    return await this.lootBoxesService.getByQRCodeAndEvent(
      qrCode.id,
      onGoingEvent.id
    );
  }

  @ResolveField('loot', () => Loot, { nullable: true })
  async getLoot(@Parent() lootBox: LootBox) {
    const { lootId } = lootBox;
    return await this.lootsService.getOneById(lootId);
  }

  @Mutation(() => LootBox, { name: 'claimLootBox' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async setLootBoxWinner(@Args('claimInput') claimInput: ClaimLootBoxInput) {
    const { email, lootBoxId } = claimInput;
    if (!isEmail(email)) {
      throw new LootBoxesFieldsError(
        LootBoxesFieldsError.EMAIL_CODES.INVALID_FORMAT,
        'Please provide a valid email address',
        { email: 'Invalid format' }
      );
    }
    const emailLowerCase = email.toLowerCase();
    return this.lootBoxesService.claimLootBox(emailLowerCase, lootBoxId);
  }

  @Mutation(() => String)
  async removeUnusedLootBoxes(@Args('password') password: string) {
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new LootBoxesError(
        LootBoxesError.FORBIDDEN,
        'Access denied: Wrong password'
      );
    }
    const removedLoots =
      await this.lootBoxesService.removeUnclaimedLootFromBox();
    return `Removed ${removedLoots} loots quanities from unclaimed lootboxes of finished events`;
  }

  @Mutation(() => String)
  async sendWinEmail(@Args('sendWinEmailInput') data: SendWinEmailInput) {
    const { lootName, email, password } = data;
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new LootsError(
        LootsError.FORBIDDEN,
        'Access denied: Wrong password'
      );
    }

    return await this.lootBoxesService.sendWinEmail(email, lootName);
  }
}
