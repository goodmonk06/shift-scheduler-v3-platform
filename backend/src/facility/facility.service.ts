import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class FacilityService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createFacilityDto: CreateFacilityDto) {
    return this.prisma.facility.create({
      data: {
        ...createFacilityDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.facility.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            staff: true,
            shiftPatterns: true,
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const facility = await this.prisma.facility.findFirst({
      where: { id, tenantId },
      include: {
        staff: true,
        shiftPatterns: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    return facility;
  }

  async update(id: string, tenantId: string, updateData: any) {
    await this.findOne(id, tenantId);

    return this.prisma.facility.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.facility.delete({
      where: { id },
    });
  }
}
