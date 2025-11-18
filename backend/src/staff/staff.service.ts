import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createStaffDto: CreateStaffDto) {
    return this.prisma.staff.create({
      data: {
        ...createStaffDto,
        tenantId,
      },
      include: {
        facility: true,
      },
    });
  }

  async findAll(tenantId: string, facilityId?: string) {
    return this.prisma.staff.findMany({
      where: {
        tenantId,
        ...(facilityId && { facilityId }),
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
  }

  async findOne(id: string, tenantId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, tenantId },
      include: {
        facility: true,
        shiftAssignments: {
          include: {
            pattern: true,
          },
          orderBy: { date: 'desc' },
          take: 30,
        },
        leaveRequests: {
          orderBy: { startDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async update(id: string, tenantId: string, updateData: any) {
    await this.findOne(id, tenantId);

    return this.prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        facility: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.staff.delete({
      where: { id },
    });
  }
}
