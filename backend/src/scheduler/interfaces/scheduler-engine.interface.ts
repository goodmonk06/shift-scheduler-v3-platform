import { Staff, ShiftPattern, ConstraintRule, LeaveRequest } from '@prisma/client';

export interface ScheduleInput {
  facilityId: string;
  startDate: Date;
  endDate: Date;
  staff: Staff[];
  patterns: ShiftPattern[];
  constraints: ConstraintRule[];
  leaveRequests: LeaveRequest[];
}

export interface ScheduleOutput {
  assignments: {
    staffId: string;
    patternId: string;
    date: Date;
  }[];
  warnings?: string[];
  score?: number;
}

export interface ISchedulerEngine {
  generate(input: ScheduleInput): Promise<ScheduleOutput>;
}
