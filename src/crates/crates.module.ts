import { Module } from '@nestjs/common';
import { CratesService } from './crates.service';
import { CratesResolver } from './crates.resolver';

@Module({
  providers: [CratesResolver, CratesService],
  exports: [CratesService],
})
export class CratesModule {}
