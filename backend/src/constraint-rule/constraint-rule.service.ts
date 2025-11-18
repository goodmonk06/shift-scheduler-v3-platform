import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConstraintRuleService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.constraintRule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, facilityId?: string) {
    return this.prisma.constraintRule.findMany({
      where: {
        tenantId,
        ...(facilityId && { facilityId }),
        isActive: true,
      },
      include: {
        facility: true,
      },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.constraintRule.findFirst({
      where: { id, tenantId },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    return this.prisma.constraintRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.constraintRule.delete({
      where: { id },
    });
  }
}
