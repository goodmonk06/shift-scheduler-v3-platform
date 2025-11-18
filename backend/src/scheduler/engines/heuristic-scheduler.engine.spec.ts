import { HeuristicSchedulerEngine } from './heuristic-scheduler.engine';
import { ScheduleInput } from '../interfaces/scheduler-engine.interface';
import { FacilityType, EmploymentType } from '@prisma/client';

describe('HeuristicSchedulerEngine', () => {
  let engine: HeuristicSchedulerEngine;

  beforeEach(() => {
    engine = new HeuristicSchedulerEngine();
  });

  describe('generate', () => {
    it('should generate shift assignments', async () => {
      const input: ScheduleInput = {
        facilityId: 'facility-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-07'),
        staff: [
          {
            id: 'staff-1',
            name: 'スタッフA',
            employeeNumber: null,
            email: null,
            phone: null,
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            employmentType: EmploymentType.FULL_TIME,
            position: null,
            skills: ['介護福祉士'],
            maxHoursPerWeek: 40,
            maxDaysPerWeek: 5,
            preferredDays: [1, 2, 3, 4, 5],
            isActive: true,
            staffId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'staff-2',
            name: 'スタッフB',
            employeeNumber: null,
            email: null,
            phone: null,
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            employmentType: EmploymentType.FULL_TIME,
            position: null,
            skills: ['介護福祉士'],
            maxHoursPerWeek: 40,
            maxDaysPerWeek: 5,
            preferredDays: [1, 2, 3, 4, 5],
            isActive: true,
            staffId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        patterns: [
          {
            id: 'pattern-1',
            name: '早番',
            shortName: '早',
            color: '#fbbf24',
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            startTime: '07:00',
            endTime: '16:00',
            breakMinutes: 60,
            requiredStaff: 2,
            requiredSkills: ['介護福祉士'],
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        constraints: [],
        leaveRequests: [],
      };

      const result = await engine.generate(input);

      expect(result).toBeDefined();
      expect(result.assignments).toBeInstanceOf(Array);
      expect(result.assignments.length).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should generate warnings when staff is insufficient', async () => {
      const input: ScheduleInput = {
        facilityId: 'facility-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        staff: [
          {
            id: 'staff-1',
            name: 'スタッフA',
            employeeNumber: null,
            email: null,
            phone: null,
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            employmentType: EmploymentType.FULL_TIME,
            position: null,
            skills: [],
            maxHoursPerWeek: 40,
            maxDaysPerWeek: 5,
            preferredDays: [],
            isActive: true,
            staffId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        patterns: [
          {
            id: 'pattern-1',
            name: '早番',
            shortName: '早',
            color: '#fbbf24',
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            startTime: '07:00',
            endTime: '16:00',
            breakMinutes: 60,
            requiredStaff: 3, // More than available staff
            requiredSkills: [],
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        constraints: [],
        leaveRequests: [],
      };

      const result = await engine.generate(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should respect leave requests', async () => {
      const staff1Id = 'staff-1';
      const input: ScheduleInput = {
        facilityId: 'facility-123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
        staff: [
          {
            id: staff1Id,
            name: 'スタッフA',
            employeeNumber: null,
            email: null,
            phone: null,
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            employmentType: EmploymentType.FULL_TIME,
            position: null,
            skills: [],
            maxHoursPerWeek: 40,
            maxDaysPerWeek: 5,
            preferredDays: [],
            isActive: true,
            staffId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        patterns: [
          {
            id: 'pattern-1',
            name: '早番',
            shortName: '早',
            color: '#fbbf24',
            facilityId: 'facility-123',
            tenantId: 'tenant-123',
            startTime: '07:00',
            endTime: '16:00',
            breakMinutes: 60,
            requiredStaff: 1,
            requiredSkills: [],
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        constraints: [],
        leaveRequests: [
          {
            id: 'leave-1',
            staffId: staff1Id,
            tenantId: 'tenant-123',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-01'),
            type: 'PAID_LEAVE' as any,
            reason: 'Vacation',
            status: 'APPROVED' as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const result = await engine.generate(input);

      // Staff on leave should not be assigned
      const assignmentsForStaff = result.assignments.filter(
        (a) => a.staffId === staff1Id && a.date.toDateString() === '2025-01-01',
      );
      expect(assignmentsForStaff.length).toBe(0);
    });
  });
});
