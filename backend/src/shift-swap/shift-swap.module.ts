import { Module } from '@nestjs/common';
import { ShiftSwapService } from './shift-swap.service';
import { ShiftSwapController } from './shift-swap.controller';
import { EventBus } from '../lib/events/domain-events';

@Module({
  controllers: [ShiftSwapController],
  providers: [
    ShiftSwapService,
    {
      provide: EventBus,
      useValue: new EventBus(),
    },
  ],
  exports: [ShiftSwapService],
})
export class ShiftSwapModule {}
