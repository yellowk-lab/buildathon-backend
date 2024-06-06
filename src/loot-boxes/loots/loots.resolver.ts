import {
  Resolver,
  Query,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Loot } from '../entities/loot.entity';
import { LootsService } from './loots.service';

@Resolver(() => Loot)
export class LootsResolver {
  constructor(private lootsService: LootsService) {}

  @Query(() => [Loot], { name: 'loots' })
  async getLoots() {
    return await this.lootsService.findAll();
  }

  @Query(() => Loot, { name: 'loot' })
  async getLoot(@Args('id', { type: () => Int }) id: number) {
    return this.lootsService.findOneById(id);
  }

  @Query(() => Int, { name: 'totalUnclaimedLoots' })
  async getTotalUnclaimedSupply() {
    return await this.lootsService.getTotalUnclaimedSupply();
  }

  @Query(() => Int, { name: 'lootsTotalSupply' })
  async getTotalSupplySum() {
    return await this.lootsService.getLootsTotalSupplySum();
  }

  @ResolveField('claimedSupply', () => Int, { nullable: true })
  async getClaimedSupply(@Parent() loot: Loot) {
    const { id } = loot;
    return await this.lootsService.countClaimedById(id);
  }
}
