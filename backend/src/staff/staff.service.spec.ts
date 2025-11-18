import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: PrismaService;

  const mockPrismaService = {
    staff: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTenantId = 'tenant-123';
  const mockFacilityId = 'facility-123';
  const mockStaff = {
    id: 'staff-123',
    name: '山田太郎',
    email: 'yamada@example.com',
    facilityId: mockFacilityId,
    tenantId: mockTenantId,
    employmentType: 'FULL_TIME',
    skills: ['介護福祉士'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new staff member', async () => {
      const createDto = {
        name: '山田太郎',
        email: 'yamada@example.com',
        facilityId: mockFacilityId,
        employmentType: 'FULL_TIME' as any,
        skills: ['介護福祉士'],
      };

      mockPrismaService.staff.create.mockResolvedValue(mockStaff);

      const result = await service.create(mockTenantId, createDto);

      expect(result).toEqual(mockStaff);
      expect(prisma.staff.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          tenantId: mockTenantId,
        },
        include: {
          facility: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of staff', async () => {
      const mockStaffList = [mockStaff];
      mockPrismaService.staff.findMany.mockResolvedValue(mockStaffList);

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(mockStaffList);
      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
        },
        include: {
          facility: true,
          _count: {
            select: {
              shiftAssignments: true,
              leaveRequests: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by facilityId when provided', async () => {
      const mockStaffList = [mockStaff];
      mockPrismaService.staff.findMany.mockResolvedValue(mockStaffList);

      await service.findAll(mockTenantId, mockFacilityId);

      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          facilityId: mockFacilityId,
        },
        include: {
          facility: true,
          _count: {
            select: {
              shiftAssignments: true,
              leaveRequests: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a staff member by id', async () => {
      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);

      const result = await service.findOne('staff-123', mockTenantId);

      expect(result).toEqual(mockStaff);
      expect(prisma.staff.findFirst).toHaveBeenCalledWith({
        where: { id: 'staff-123', tenantId: mockTenantId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when staff not found', async () => {
      mockPrismaService.staff.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a staff member', async () => {
      const updateDto = { name: '山田次郎' };
      const updatedStaff = { ...mockStaff, ...updateDto };

      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);
      mockPrismaService.staff.update.mockResolvedValue(updatedStaff);

      const result = await service.update('staff-123', mockTenantId, updateDto);

      expect(result).toEqual(updatedStaff);
      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: 'staff-123' },
        data: updateDto,
        include: {
          facility: true,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a staff member', async () => {
      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);
      mockPrismaService.staff.delete.mockResolvedValue(mockStaff);

      const result = await service.remove('staff-123', mockTenantId);

      expect(result).toEqual(mockStaff);
      expect(prisma.staff.delete).toHaveBeenCalledWith({
        where: { id: 'staff-123' },
      });
    });
  });
});
