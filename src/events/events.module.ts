import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsResolver } from './events.resolver';
import { LootsService } from '../loot-boxes/loots/loots.service';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { LootBoxesService } from '../loot-boxes/loot-boxes.service';
import { CratesService } from '../crates/crates.service';
import { MailService } from '../mail/mail.service';

@Module({
  providers: [
    EventsResolver,
    EventsService,
    LootBoxesService,
    LootsService,
    QRCodesService,
    CratesService,
    MailService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
