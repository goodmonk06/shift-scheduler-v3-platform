import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { EventBus } from '../lib/events/domain-events';

@Module({
  controllers: [DepartmentController],
  providers: [
    DepartmentService,
    {
      provide: EventBus,
      useValue: new EventBus(),
    },
  ],
  exports: [DepartmentService],
})
export class DepartmentModule {}
