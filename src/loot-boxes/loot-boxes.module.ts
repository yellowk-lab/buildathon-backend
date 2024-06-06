import { Module } from '@nestjs/common';
import { LootBoxesService } from './loot-boxes.service';
import { LootBoxesResolver } from './loot-boxes.resolver';
import { LootsResolver } from './loots/loots.resolver';
import { LootsService } from './loots/loots.service';
import { EventsService } from '../events/events.service';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { CratesService } from '../crates/crates.service';
import { EventsModule } from '../events/events.module';
import { CratesModule } from '../crates/crates.module';


@Module({
  imports: [EventsModule, CratesModule],
  providers: [
    LootBoxesResolver,
    LootBoxesService,
    LootsResolver,
    LootsService,
    EventsService,
    QRCodesService,
    CratesService
  ],
  exports: [LootBoxesService, LootsService],
})
export class LootBoxesModule {}
