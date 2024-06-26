import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { Web3Service } from '../web3/web3.service';
import { UsersService } from '../users/users.service';
import { MailService } from '@sendgrid/mail';
import { EventsService } from '../events/events.service';
import { LootBoxesModule } from '../loot-boxes/loot-boxes.module';

@Module({
  imports: [LootBoxesModule],
  providers: [
    OrdersService,
    OrdersResolver,
    Web3Service,
    UsersService,
    MailService,
    EventsService,
  ],
})
export class OrdersModule {}
