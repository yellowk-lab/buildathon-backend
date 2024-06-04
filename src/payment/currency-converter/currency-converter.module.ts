import { Module } from '@nestjs/common';
import { CurrencyConverterService } from './currency-converter.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [CurrencyConverterService],
  exports: [CurrencyConverterService],
})
export class CurrencyConverterModule {}
