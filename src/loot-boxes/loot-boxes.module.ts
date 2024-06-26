import { Module } from '@nestjs/common';
import { LootBoxesService } from './loot-boxes.service';
import { LootBoxesResolver } from './loot-boxes.resolver';
import { LootsResolver } from './loots/loots.resolver';
import { LootsService } from './loots/loots.service';
import { EventsModule } from '../events/events.module';
import { Web3Service } from '../web3/web3.service';
import { LocationsService } from '../locations/locations.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@Module({
  imports: [EventsModule],
  providers: [
    LootBoxesResolver,
    LootBoxesService,
    LootsResolver,
    LootsService,
    Web3Service,
    LocationsService,
    UsersService,
    OrdersService,
  ],
  exports: [LootBoxesService, LootsService],
})
export class LootBoxesModule {}
