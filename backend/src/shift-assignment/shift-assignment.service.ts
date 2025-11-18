import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';

@Injectable()
export class ShiftAssignmentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createShiftAssignmentDto: CreateShiftAssignmentDto) {
    // 重複チェック
    const existing = await this.prisma.shiftAssignment.findFirst({
      where: {
        staffId: createShiftAssignmentDto.staffId,
        date: new Date(createShiftAssignmentDto.date),
        patternId: createShiftAssignmentDto.patternId,
      },
    });

    if (existing) {
      throw new ConflictException('This assignment already exists');
    }

    return this.prisma.shiftAssignment.create({
      data: {
        ...createShiftAssignmentDto,
        date: new Date(createShiftAssignmentDto.date),
        tenantId,
      },
      include: {
        staff: true,
        pattern: true,
        facility: true,
      },
    });
  }

  async findAll(
    tenantId: string,
    facilityId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        tenantId,
        ...(facilityId && { facilityId }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        staff: true,
        pattern: true,
        facility: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: { id, tenantId },
      include: {
        staff: true,
        pattern: true,
        facility: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Shift assignment not found');
    }

    return assignment;
  }

  async update(id: string, tenantId: string, updateData: any) {
    await this.findOne(id, tenantId);

    return this.prisma.shiftAssignment.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        pattern: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.shiftAssignment.delete({
      where: { id },
    });
  }

  async bulkCreate(tenantId: string, assignments: CreateShiftAssignmentDto[]) {
    const created = await Promise.all(
      assignments.map((dto) => this.create(tenantId, dto)),
    );
    return created;
  }
}
