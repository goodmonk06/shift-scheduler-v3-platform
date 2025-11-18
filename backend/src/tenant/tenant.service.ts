import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        facilities: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
