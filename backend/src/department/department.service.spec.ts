import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../lib/events/domain-events';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let prisma: PrismaService;
  let eventBus: EventBus;

  const mockTenantId = 'tenant-123';
  const mockDepartmentId = 'dept-123';

  const mockDepartment = {
    id: mockDepartmentId,
    name: 'Engineering',
    description: 'Engineering Department',
    parentId: null,
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: null,
    children: [],
    _count: {
      staff: 5,
      children: 2,
    },
  };

  const mockPrismaService = {
    department: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<EventBus>(EventBus);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new department', async () => {
      const createDto: CreateDepartmentDto = {
        name: 'Engineering',
        description: 'Engineering Department',
      };

      mockPrismaService.department.create.mockResolvedValue(mockDepartment);

      const result = await service.create(mockTenantId, createDto);

      expect(result).toEqual(mockDepartment);
      expect(mockPrismaService.department.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          tenantId: mockTenantId,
        },
        include: {
          parent: true,
          _count: {
            select: {
              staff: true,
              children: true,
            },
          },
        },
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should create a department with parent', async () => {
      const parentDept = { ...mockDepartment, id: 'parent-123' };
      const createDto: CreateDepartmentDto = {
        name: 'Backend Team',
        parentId: 'parent-123',
      };

      mockPrismaService.department.findFirst.mockResolvedValue(parentDept);
      mockPrismaService.department.create.mockResolvedValue({
        ...mockDepartment,
        parentId: 'parent-123',
        parent: parentDept,
      });

      const result = await service.create(mockTenantId, createDto);

      expect(result.parentId).toBe('parent-123');
      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'parent-123',
          tenantId: mockTenantId,
        },
      });
    });

    it('should throw BadRequestException if parent not found', async () => {
      const createDto: CreateDepartmentDto = {
        name: 'Backend Team',
        parentId: 'nonexistent-parent',
      };

      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      const departments = [mockDepartment];
      mockPrismaService.department.findMany.mockResolvedValue(departments);

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual(departments);
      expect(mockPrismaService.department.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: {
          parent: true,
          children: false,
          _count: {
            select: {
              staff: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should include hierarchy when requested', async () => {
      const departments = [mockDepartment];
      mockPrismaService.department.findMany.mockResolvedValue(departments);

      await service.findAll(mockTenantId, true);

      expect(mockPrismaService.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            children: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(mockDepartment);

      const result = await service.findOne(mockDepartmentId, mockTenantId);

      expect(result).toEqual(mockDepartment);
      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: { id: mockDepartmentId, tenantId: mockTenantId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if department not found', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockDepartmentId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHierarchy', () => {
    it('should return full hierarchy for tenant', async () => {
      const rootDept = { ...mockDepartment, parentId: null };
      const childDept = { ...mockDepartment, id: 'child-123', parentId: mockDepartmentId };

      mockPrismaService.department.findMany.mockResolvedValue([rootDept]);
      mockPrismaService.department.findUnique
        .mockResolvedValueOnce({ ...rootDept, children: [{ id: 'child-123' }] })
        .mockResolvedValueOnce({ ...childDept, children: [] });

      const result = await service.getHierarchy(mockTenantId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return hierarchy for specific root', async () => {
      const rootDept = { ...mockDepartment, children: [] };

      mockPrismaService.department.findUnique.mockResolvedValue(rootDept);

      const result = await service.getHierarchy(mockTenantId, mockDepartmentId);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Updated Engineering',
      };

      mockPrismaService.department.findFirst.mockResolvedValue(mockDepartment);
      mockPrismaService.department.update.mockResolvedValue({
        ...mockDepartment,
        ...updateDto,
      });

      const result = await service.update(mockDepartmentId, mockTenantId, updateDto);

      expect(result.name).toBe('Updated Engineering');
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should validate parent when updating parentId', async () => {
      const updateDto: UpdateDepartmentDto = {
        parentId: 'new-parent-123',
      };
      const parentDept = { ...mockDepartment, id: 'new-parent-123' };

      mockPrismaService.department.findFirst
        .mockResolvedValueOnce(mockDepartment) // findOne call
        .mockResolvedValueOnce(parentDept); // parent validation

      mockPrismaService.department.update.mockResolvedValue({
        ...mockDepartment,
        parentId: 'new-parent-123',
      });

      await service.update(mockDepartmentId, mockTenantId, updateDto);

      expect(mockPrismaService.department.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'new-parent-123',
          tenantId: mockTenantId,
        },
      });
    });

    it('should prevent setting self as parent', async () => {
      const updateDto: UpdateDepartmentDto = {
        parentId: mockDepartmentId,
      };

      mockPrismaService.department.findFirst.mockResolvedValue(mockDepartment);

      await expect(
        service.update(mockDepartmentId, mockTenantId, updateDto),
      ).rejects.toThrow('Department cannot be its own parent');
    });
  });

  describe('remove', () => {
    it('should delete an empty department', async () => {
      const emptyDept = {
        ...mockDepartment,
        _count: { staff: 0, children: 0 },
      };

      mockPrismaService.department.findFirst.mockResolvedValue(emptyDept);
      mockPrismaService.department.delete.mockResolvedValue(emptyDept);

      const result = await service.remove(mockDepartmentId, mockTenantId);

      expect(result).toEqual(emptyDept);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw BadRequestException if department has children', async () => {
      const deptWithChildren = {
        ...mockDepartment,
        _count: { staff: 0, children: 2 },
      };

      mockPrismaService.department.findFirst.mockResolvedValue(deptWithChildren);

      await expect(service.remove(mockDepartmentId, mockTenantId)).rejects.toThrow(
        'Cannot delete department with child departments',
      );
    });

    it('should throw BadRequestException if department has staff', async () => {
      const deptWithStaff = {
        ...mockDepartment,
        _count: { staff: 5, children: 0 },
      };

      mockPrismaService.department.findFirst.mockResolvedValue(deptWithStaff);

      await expect(service.remove(mockDepartmentId, mockTenantId)).rejects.toThrow(
        'Cannot delete department with assigned staff',
      );
    });
  });

  describe('assignStaff', () => {
    it('should assign staff to department', async () => {
      const mockStaff = {
        id: 'staff-123',
        name: 'John Doe',
        tenantId: mockTenantId,
        department: mockDepartment,
      };

      mockPrismaService.department.findFirst.mockResolvedValue(mockDepartment);
      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);
      mockPrismaService.staff.update.mockResolvedValue(mockStaff);

      const result = await service.assignStaff(
        mockDepartmentId,
        'staff-123',
        mockTenantId,
      );

      expect(result).toEqual(mockStaff);
      expect(mockPrismaService.staff.update).toHaveBeenCalledWith({
        where: { id: 'staff-123' },
        data: { departmentId: mockDepartmentId },
        include: { department: true },
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw NotFoundException if staff not found', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(mockDepartment);
      mockPrismaService.staff.findFirst.mockResolvedValue(null);

      await expect(
        service.assignStaff(mockDepartmentId, 'nonexistent-staff', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unassignStaff', () => {
    it('should unassign staff from department', async () => {
      const mockStaff = {
        id: 'staff-123',
        name: 'John Doe',
        departmentId: mockDepartmentId,
        tenantId: mockTenantId,
      };

      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);
      mockPrismaService.staff.update.mockResolvedValue({
        ...mockStaff,
        departmentId: null,
      });

      const result = await service.unassignStaff('staff-123', mockTenantId);

      expect(result.departmentId).toBeNull();
      expect(mockPrismaService.staff.update).toHaveBeenCalledWith({
        where: { id: 'staff-123' },
        data: { departmentId: null },
      });
    });
  });
});
