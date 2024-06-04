import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { FeesModule } from '../fees/fees.module';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [FeesModule],
})
export class UsersModule {}
