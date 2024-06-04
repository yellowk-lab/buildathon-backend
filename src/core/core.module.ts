import { Module } from '@nestjs/common';
import { MomentService } from './moment/moment.service';

@Module({
  providers: [MomentService],
})
export class CoreModule {}
