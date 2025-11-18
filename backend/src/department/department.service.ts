import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { EventBus, EventType, createEvent } from '../lib/events/domain-events';
import { metrics, MetricNames } from '../lib/metrics';
import { logger } from '../lib/logger';

@Injectable()
export class DepartmentService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
  ) {}

  async create(tenantId: string, createDepartmentDto: CreateDepartmentDto) {
    const log = logger.child({ tenantId, action: 'create_department' });

    // Validate parent exists if provided
    if (createDepartmentDto.parentId) {
      const parent = await this.prisma.department.findFirst({
        where: {
          id: createDepartmentDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        log.warn('Parent department not found', { parentId: createDepartmentDto.parentId });
        throw new BadRequestException('Parent department not found');
      }
    }

    const department = await this.prisma.department.create({
      data: {
        ...createDepartmentDto,
        tenantId,
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

    log.info('Department created', { departmentId: department.id, name: department.name });

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.DEPARTMENT_CREATED, department.id, tenantId, {
        departmentName: department.name,
        parentId: department.parentId,
      }),
    );

    // Track metrics
    await metrics.incrementCounter(MetricNames.DEPARTMENT_CREATED, {
      tenantId,
      hasParent: department.parentId ? 'true' : 'false',
    });

    return department;
  }

  async findAll(tenantId: string, includeHierarchy = false) {
    const log = logger.child({ tenantId, action: 'find_all_departments' });

    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      include: {
        parent: true,
        children: includeHierarchy,
        _count: {
          select: {
            staff: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    log.debug('Departments retrieved', { count: departments.length });

    return departments;
  }

  async findOne(id: string, tenantId: string) {
    const log = logger.child({ tenantId, departmentId: id, action: 'find_one_department' });

    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                staff: true,
                children: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            staff: true,
            children: true,
          },
        },
      },
    });

    if (!department) {
      log.warn('Department not found');
      throw new NotFoundException('Department not found');
    }

    log.debug('Department retrieved', { name: department.name });

    return department;
  }

  async getHierarchy(tenantId: string, rootId?: string) {
    const log = logger.child({ tenantId, rootId, action: 'get_hierarchy' });

    const where: any = { tenantId };
    if (rootId) {
      where.id = rootId;
    } else {
      where.parentId = null; // Get root departments
    }

    const buildHierarchy = async (departmentId: string): Promise<any> => {
      const dept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          children: true,
          _count: {
            select: {
              staff: true,
            },
          },
        },
      });

      if (!dept) return null;

      const children = await Promise.all(
        dept.children.map((child) => buildHierarchy(child.id)),
      );

      return {
        ...dept,
        children,
      };
    };

    if (rootId) {
      const hierarchy = await buildHierarchy(rootId);
      log.info('Hierarchy retrieved for root', { rootId });
      return hierarchy;
    }

    // Get all root departments and build their hierarchies
    const rootDepartments = await this.prisma.department.findMany({
      where,
    });

    const hierarchies = await Promise.all(
      rootDepartments.map((dept) => buildHierarchy(dept.id)),
    );

    log.info('Full hierarchy retrieved', { rootCount: rootDepartments.length });

    return hierarchies;
  }

  async update(id: string, tenantId: string, updateDepartmentDto: UpdateDepartmentDto) {
    const log = logger.child({ tenantId, departmentId: id, action: 'update_department' });

    await this.findOne(id, tenantId);

    // Validate parent if being updated
    if (updateDepartmentDto.parentId) {
      // Check parent exists
      const parent = await this.prisma.department.findFirst({
        where: {
          id: updateDepartmentDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        log.warn('Parent department not found', { parentId: updateDepartmentDto.parentId });
        throw new BadRequestException('Parent department not found');
      }

      // Prevent circular reference (setting parent to self or descendant)
      if (updateDepartmentDto.parentId === id) {
        log.warn('Circular reference attempt: self as parent');
        throw new BadRequestException('Department cannot be its own parent');
      }

      // Check if new parent is a descendant
      const isDescendant = await this.isDescendant(id, updateDepartmentDto.parentId, tenantId);
      if (isDescendant) {
        log.warn('Circular reference attempt: descendant as parent', {
          parentId: updateDepartmentDto.parentId,
        });
        throw new BadRequestException('Cannot set a descendant as parent');
      }
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
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

    log.info('Department updated', { name: department.name });

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.DEPARTMENT_UPDATED, department.id, tenantId, {
        departmentName: department.name,
        changes: updateDepartmentDto,
      }),
    );

    return department;
  }

  async remove(id: string, tenantId: string) {
    const log = logger.child({ tenantId, departmentId: id, action: 'remove_department' });

    const department = await this.findOne(id, tenantId);

    // Check if department has children
    if (department._count.children > 0) {
      log.warn('Cannot delete department with children', { childrenCount: department._count.children });
      throw new BadRequestException('Cannot delete department with child departments');
    }

    // Check if department has staff
    if (department._count.staff > 0) {
      log.warn('Cannot delete department with staff', { staffCount: department._count.staff });
      throw new BadRequestException('Cannot delete department with assigned staff');
    }

    await this.prisma.department.delete({
      where: { id },
    });

    log.info('Department deleted', { name: department.name });

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.DEPARTMENT_DELETED, department.id, tenantId, {
        departmentName: department.name,
      }),
    );

    return department;
  }

  /**
   * Check if potentialDescendantId is a descendant of ancestorId
   */
  private async isDescendant(
    ancestorId: string,
    potentialDescendantId: string,
    tenantId: string,
  ): Promise<boolean> {
    const descendant = await this.prisma.department.findFirst({
      where: {
        id: potentialDescendantId,
        tenantId,
      },
      include: {
        parent: true,
      },
    });

    if (!descendant || !descendant.parent) {
      return false;
    }

    if (descendant.parent.id === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parent.id, tenantId);
  }

  async assignStaff(departmentId: string, staffId: string, tenantId: string) {
    const log = logger.child({ tenantId, departmentId, staffId, action: 'assign_staff' });

    // Verify department exists
    await this.findOne(departmentId, tenantId);

    // Verify staff exists and belongs to tenant
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId,
      },
    });

    if (!staff) {
      log.warn('Staff not found');
      throw new NotFoundException('Staff not found');
    }

    // Update staff's department
    const updatedStaff = await this.prisma.staff.update({
      where: { id: staffId },
      data: { departmentId },
      include: {
        department: true,
      },
    });

    log.info('Staff assigned to department', {
      staffName: updatedStaff.name,
      departmentName: updatedStaff.department?.name,
    });

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.STAFF_ASSIGNED_TO_DEPARTMENT, staffId, tenantId, {
        staffName: updatedStaff.name,
        departmentId,
        departmentName: updatedStaff.department?.name,
      }),
    );

    return updatedStaff;
  }

  async unassignStaff(staffId: string, tenantId: string) {
    const log = logger.child({ tenantId, staffId, action: 'unassign_staff' });

    // Verify staff exists
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId,
      },
    });

    if (!staff) {
      log.warn('Staff not found');
      throw new NotFoundException('Staff not found');
    }

    // Remove staff from department
    const updatedStaff = await this.prisma.staff.update({
      where: { id: staffId },
      data: { departmentId: null },
    });

    log.info('Staff unassigned from department', { staffName: updatedStaff.name });

    return updatedStaff;
  }
}
