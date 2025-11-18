import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeuristicSchedulerEngine } from './engines/heuristic-scheduler.engine';
import { ScheduleInput } from './interfaces/scheduler-engine.interface';

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    private heuristicEngine: HeuristicSchedulerEngine,
  ) {}

  async generateSchedule(
    tenantId: string,
    facilityId: string,
    startDate: string,
    endDate: string,
  ) {
    // データ取得
    const facility = await this.prisma.facility.findFirst({
      where: { id: facilityId, tenantId },
    });

    if (!facility) {
      throw new Error('Facility not found');
    }

    const staff = await this.prisma.staff.findMany({
      where: { facilityId, tenantId, isActive: true },
    });

    const patterns = await this.prisma.shiftPattern.findMany({
      where: { facilityId, tenantId, isActive: true },
    });

    const constraints = await this.prisma.constraintRule.findMany({
      where: { facilityId, tenantId, isActive: true },
    });

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        staff: { facilityId },
        status: 'APPROVED',
        OR: [
          {
            startDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          {
            endDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        ],
      },
    });

    const input: ScheduleInput = {
      facilityId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      staff,
      patterns,
      constraints,
      leaveRequests,
    };

    // スケジュール生成
    const result = await this.heuristicEngine.generate(input);

    // DB保存（オプション）
    // ここでは結果を返すのみ。実際に保存する場合は別のエンドポイントで

    return result;
  }

  async saveGeneratedSchedule(
    tenantId: string,
    facilityId: string,
    assignments: any[],
  ) {
    // 既存のDRAFTスケジュールを削除
    await this.prisma.shiftAssignment.deleteMany({
      where: {
        facilityId,
        tenantId,
        status: 'DRAFT',
      },
    });

    // 新しいスケジュールを保存
    const created = await this.prisma.shiftAssignment.createMany({
      data: assignments.map(a => ({
        ...a,
        facilityId,
        tenantId,
        status: 'DRAFT' as any,
      })),
    });

    return created;
  }
}
