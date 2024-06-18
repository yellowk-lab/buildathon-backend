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
  async getLoot(@Args('id') id: string) {
    return this.lootsService.findOneById(id);
  }

  @ResolveField('claimedSupply', () => Int, { nullable: true })
  async getClaimedSupply(@Parent() loot: Loot) {
    const { id } = loot;
    return await this.lootsService.countClaimedById(id);
  }
}
