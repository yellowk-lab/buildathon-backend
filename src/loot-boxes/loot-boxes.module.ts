import { Module } from '@nestjs/common';
import { LootBoxesService } from './loot-boxes.service';
import { LootBoxesResolver } from './loot-boxes.resolver';
import { LootsResolver } from './loots/loots.resolver';
import { LootsService } from './loots/loots.service';
import { EventsModule } from '../events/events.module';
import { Web3Service } from '../web3/web3.service';


@Module({
  imports: [EventsModule],
  providers: [LootBoxesResolver, LootBoxesService, LootsResolver, LootsService, Web3Service],
  exports: [LootBoxesService, LootsService],
})
export class LootBoxesModule {}
