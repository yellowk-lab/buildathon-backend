import { Module } from '@nestjs/common';
import { QRCodesService } from './qr-codes.service';

@Module({
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QRCodesModule {}
