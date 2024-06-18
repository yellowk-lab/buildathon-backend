import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsResolver } from './events.resolver';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { MailService } from '../mail/mail.service';

@Module({
  providers: [
    EventsResolver,
    EventsService,
    LootBoxesService,
    LootsService,
    MailService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
