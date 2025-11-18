import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { HeuristicSchedulerEngine } from './engines/heuristic-scheduler.engine';

@Module({
  controllers: [SchedulerController],
  providers: [SchedulerService, HeuristicSchedulerEngine],
  exports: [SchedulerService],
})
export class SchedulerModule {}
