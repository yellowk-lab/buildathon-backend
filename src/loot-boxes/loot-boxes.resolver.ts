import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { LootBoxesService } from './loot-boxes.service';
import { LootBox } from './entities/loot-box.entity';
import { ClaimLootBoxInput } from './dto/claim-loot-box.input';
import { LootsService } from './loots/loots.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ScanLootBoxInput } from './dto/scan-loot-box.input';
import { LootBoxesError, LootBoxesFieldsError } from './loot-boxes.error';
import { isEmail } from '../common/utils/email.util';
import { ConfigService } from '@nestjs/config';
import { LootsError } from './loots/loots.error';
import { Location } from '@module/locations/entities/location.entity';
import { Loot } from './entities/loot.entity';
import { LocationsService } from '../locations/locations.service';
import { EventsService } from '../events/events.service';
import { Event } from '../events/entities/event.entity';
import { EventStatus } from '../events/events.enum';
import { UsersService } from '../users/users.service';

@Resolver(() => LootBox)
export class LootBoxesResolver {
  constructor(
    private lootBoxesService: LootBoxesService,
    private lootsService: LootsService,
    private locationsService: LocationsService,
    private eventsService: EventsService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  @Query(() => [String], { name: 'lootBoxIdsForEvent' })
  async fetchLootBoxIdsByEvent(
    @Args('eventId') eventId: string,
    @Args('password') password: string,
  ) {
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new LootsError(
        LootsError.FORBIDDEN,
        'Access denied: Wrong password',
      );
    }
    await this.eventsService.findOneById(eventId);
    return this.lootBoxesService.retrieveIdsByEventId(eventId);
  }
  @Query(() => LootBox, { name: 'lootbox' })
  async getLootBoxById(@Args('id') id: string) {
    return await this.lootBoxesService.findOneById(id);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Query(() => LootBox, { name: 'scanLootBox' })
  async getLootBoxByScan(@Args('input') input: ScanLootBoxInput) {
    const { hash, ...coordinates } = input;
    const lootBox = await this.lootBoxesService.getLootBoxWithinRange(
      hash,
      coordinates,
    );
    const { status } = await this.eventsService.getOneById(lootBox.eventId);
    if (status !== EventStatus.ACTIVE) {
      throw new LootBoxesError(
        LootBoxesError.FORBIDDEN,
        'LootBox event not active yet',
      );
    }
    return lootBox;
  }

  @Query(() => [LootBox], { name: 'lootBoxes' })
  async getLootBoxesClaimedByUser(
    @Args('emailOrWallet') emailOrWallet: string,
  ) {
    let user = null;
    if (isEmail(emailOrWallet)) {
      user = await this.usersService.getOneByEmail(emailOrWallet);
    } else {
      user = await this.usersService.getOneByWalletAddress(emailOrWallet);
    }

    if (user) {
      return await this.lootBoxesService.findAll({ claimedById: user.id });
    } else {
      return [];
    }
  }

  @Mutation(() => LootBox, { name: 'claimLootBox' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async claimLootBox(@Args('input') input: ClaimLootBoxInput) {
    const { email, address, lootBoxId } = input;
    const emailLowerCase = email ? email.toLowerCase() : null;
    return this.lootBoxesService.claimLootBox(
      address,
      lootBoxId,
      emailLowerCase,
    );
  }

  @Mutation(() => LootBox, { name: 'assignLocationToLootBox' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOrCreateLocationForLootBox(
    @Args('input') input: ScanLootBoxInput,
  ) {
    const { hash, ...coordinates } = input;
    return await this.lootBoxesService.upsertLootBoxLocation(hash, coordinates);
  }

  @ResolveField('loot', () => Loot, { nullable: true })
  async getLoot(@Parent() lootBox: LootBox) {
    const { lootId } = lootBox;
    return this.lootsService.getOneById(lootId);
  }

  @ResolveField('location', () => Location, { nullable: true })
  async getLocation(@Parent() lootBox: LootBox) {
    const { locationId } = lootBox;
    return await this.locationsService.getOneById(locationId);
  }

  @ResolveField('event', () => Event, { nullable: true })
  async getEvent(@Parent() lootBox: LootBox) {
    const { eventId } = lootBox;
    return await this.eventsService.getOneById(eventId);
  }

  @ResolveField('lootClaimed', () => Boolean)
  async hasBeenClaimed(@Parent() lootBox: LootBox) {
    const { claimedById } = lootBox;
    return !!claimedById;
  }
}
