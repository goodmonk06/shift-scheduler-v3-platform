import { Injectable } from '@nestjs/common';
import { ISchedulerEngine, ScheduleInput, ScheduleOutput } from '../interfaces/scheduler-engine.interface';

@Injectable()
export class HeuristicSchedulerEngine implements ISchedulerEngine {
  async generate(input: ScheduleInput): Promise<ScheduleOutput> {
    const assignments: ScheduleOutput['assignments'] = [];
    const warnings: string[] = [];

    // シンプルなヒューリスティックアルゴリズム
    // 1. 日付ごとにループ
    // 2. パターンごとに必要人数を割り当て
    // 3. 制約をチェック

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const activeStaff = input.staff.filter(s => s.isActive);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const dayOfWeek = currentDate.getDay();

      // 休暇中のスタッフを除外
      const availableStaff = activeStaff.filter(staff => {
        return !input.leaveRequests.some(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          return staff.id === leave.staffId &&
                 currentDate >= leaveStart &&
                 currentDate <= leaveEnd &&
                 leave.status === 'APPROVED';
        });
      });

      // パターンごとに割り当て
      for (const pattern of input.patterns) {
        const requiredCount = pattern.requiredStaff;

        // スキル要件を満たすスタッフをフィルタ
        let eligibleStaff = availableStaff.filter(staff => {
          if (pattern.requiredSkills.length === 0) return true;
          return pattern.requiredSkills.some(skill => staff.skills.includes(skill));
        });

        // 希望曜日を優先
        const preferredStaff = eligibleStaff.filter(staff => {
          if (!staff.preferredDays || staff.preferredDays.length === 0) return false;
          return staff.preferredDays.includes(dayOfWeek);
        });

        // 希望曜日のスタッフを優先して割り当て
        const selectedStaff = preferredStaff.length >= requiredCount
          ? preferredStaff.slice(0, requiredCount)
          : [
              ...preferredStaff,
              ...eligibleStaff.filter(s => !preferredStaff.includes(s)).slice(0, requiredCount - preferredStaff.length)
            ];

        if (selectedStaff.length < requiredCount) {
          warnings.push(
            `${currentDate.toISOString().split('T')[0]} - ${pattern.name}: 必要人数${requiredCount}人に対し、${selectedStaff.length}人のみ割り当て可能`
          );
        }

        // 割り当てを追加
        selectedStaff.forEach(staff => {
          assignments.push({
            staffId: staff.id,
            patternId: pattern.id,
            date: new Date(currentDate),
          });
        });

        // 割り当てたスタッフを利用可能リストから除外（1日1シフト制限）
        eligibleStaff = eligibleStaff.filter(s => !selectedStaff.includes(s));
      }
    }

    return {
      assignments,
      warnings,
      score: this.calculateScore(assignments, warnings),
    };
  }

  private calculateScore(assignments: any[], warnings: string[]): number {
    // スコア計算（100点満点）
    const baseScore = 100;
    const penaltyPerWarning = 5;
    return Math.max(0, baseScore - (warnings.length * penaltyPerWarning));
  }
}
