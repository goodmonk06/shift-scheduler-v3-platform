import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EventBus } from '../lib/events/domain-events';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: EventBus,
      useValue: new EventBus(),
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
