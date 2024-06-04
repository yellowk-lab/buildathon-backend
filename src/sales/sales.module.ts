import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { SalesListener } from './sales.listener';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  providers: [SalesService, SalesListener],
  imports: [ProductsModule, UsersModule, TransactionsModule, FeesModule],
  exports: [SalesService],
})
export class SalesModule {}
