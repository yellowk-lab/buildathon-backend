import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { LootBoxesService } from './loot-boxes.service';
import { LootBox } from './entities/loot-box.entity';
import { ClaimLootBoxInput } from './dto/claim-loot-box.input';
import { LootsService } from './loots/loots.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ScanLootBoxInput as ScanLootBoxInput } from './dto/scan-loot-box.input';
import { LootBoxesFieldsError } from './loot-boxes.error';
import { isEmail } from '../common/utils/email.util';
import { ConfigService } from '@nestjs/config';
import { SendWinEmailInput } from './dto/send-win-email.input';
import { LootsError } from './loots/loots.error';
import { Location } from '@module/locations/entities/location.entity';

@Resolver(() => LootBox)
export class LootBoxesResolver {
  constructor(
    private lootBoxesService: LootBoxesService,
    private lootsService: LootsService,
    private configService: ConfigService,
  ) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Mutation(() => LootBox, { name: 'scanLootBox' })
  async scanLootBox(@Args('input') input: ScanLootBoxInput) {
    const { hash, ...coordinates } = input;
    return this.lootBoxesService.getLootBoxWithinRange(hash, coordinates);
  }

  @ResolveField('location', () => Location, { nullable: true })
  async getLocation(@Parent() lootBox: LootBox) {
    const { id } = lootBox;
    return await this.lootBoxesService.getLocationBy(id);
  }

  @Mutation(() => LootBox, { name: 'claimLootBox' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async claimLootBox(@Args('input') input: ClaimLootBoxInput) {
    const { email, lootBoxId } = input;
    if (!isEmail(email)) {
      throw new LootBoxesFieldsError(
        LootBoxesFieldsError.EMAIL_CODES.INVALID_FORMAT,
        'Please provide a valid email address',
        { email: 'Invalid format' },
      );
    }
    const emailLowerCase = email.toLowerCase();
    return this.lootBoxesService.claimLootBox(emailLowerCase, lootBoxId);
  }

  @Mutation(() => String)
  async sendWinEmail(@Args('sendWinEmailInput') data: SendWinEmailInput) {
    const { lootName, email, eventId, password } = data;
    if (password !== this.configService.get<string>('PASSWORD')) {
      throw new LootsError(
        LootsError.FORBIDDEN,
        'Access denied: Wrong password',
      );
    }
    return await this.lootBoxesService.sendWinEmail(email, lootName, eventId);
  }
}
