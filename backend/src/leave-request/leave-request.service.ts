import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveRequestService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.leaveRequest.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        tenantId,
      },
      include: {
        staff: true,
      },
    });
  }

  async findAll(tenantId: string, staffId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(staffId && { staffId }),
      },
      include: {
        staff: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      include: {
        staff: true,
      },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.leaveRequest.delete({
      where: { id },
    });
  }
}
