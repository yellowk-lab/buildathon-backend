import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PayoutsService } from './payouts.service';
@Module({
  providers: [TransactionsService, PayoutsService],
  exports: [TransactionsService, PayoutsService],
})
export class TransactionsModule {}
