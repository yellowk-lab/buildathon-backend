import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { Web3Service } from '../web3/web3.service';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { LootBoxesModule } from '../loot-boxes/loot-boxes.module';
import { UsersService } from '../users/users.service';
import { MailService } from '@sendgrid/mail';

@Module({
  providers: [
    OrdersService,
    OrdersResolver,
    LootBoxesService,
    LootsService,
    Web3Service,
    UsersService,
    MailService,
  ],
  imports: [LootBoxesModule],
})
export class OrdersModule {}
