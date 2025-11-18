import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftPatternDto } from './dto/create-shift-pattern.dto';

@Injectable()
export class ShiftPatternService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createShiftPatternDto: CreateShiftPatternDto) {
    return this.prisma.shiftPattern.create({
      data: {
        ...createShiftPatternDto,
        tenantId,
      },
      include: {
        facility: true,
      },
    });
  }

  async findAll(tenantId: string, facilityId?: string) {
    return this.prisma.shiftPattern.findMany({
      where: {
        tenantId,
        ...(facilityId && { facilityId }),
        isActive: true,
      },
      include: {
        facility: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const pattern = await this.prisma.shiftPattern.findFirst({
      where: { id, tenantId },
      include: {
        facility: true,
        _count: {
          select: {
            shiftAssignments: true,
          },
        },
      },
    });

    if (!pattern) {
      throw new NotFoundException('Shift pattern not found');
    }

    return pattern;
  }

  async update(id: string, tenantId: string, updateData: any) {
    await this.findOne(id, tenantId);

    return this.prisma.shiftPattern.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.shiftPattern.delete({
      where: { id },
    });
  }
}
