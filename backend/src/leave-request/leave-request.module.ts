import { Module } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';

@Module({
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
