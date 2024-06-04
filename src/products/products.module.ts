import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { UsersService } from '../users/users.service';
import { DigitalOceanService } from '../digital-ocean/digital-ocean.service';
import { PaymentModule } from '../payment/payment.module';
import { AuthModule } from '../auth/auth.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  providers: [
    ProductsResolver,
    ProductsService,
    UsersService,
    DigitalOceanService,
  ],
  exports: [ProductsService],
  imports: [PaymentModule, AuthModule, TransactionsModule, FeesModule],
})
export class ProductsModule {}
