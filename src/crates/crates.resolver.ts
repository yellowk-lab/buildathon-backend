import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Crate } from './entities/crate.entity';
import { CratesService } from './crates.service';
import { PaginationArgs } from '../common/args/pagination.args';

@Resolver(() => Crate)
export class CratesResolver {
  constructor(private readonly cratesService: CratesService) {}

  @Query(() => [Crate], { name: 'crates' })
  async getCrates(@Args() args: PaginationArgs) {
    return await this.cratesService.findAll(args.take, args.skip);
  }

  @Query(() => Crate, { name: 'crate' })
  async getCrate(@Args('id', { type: () => Int }) id: number) {
    return await this.cratesService.findOneById(id);
  }
}
