import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Scheduler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async generate(
    @CurrentTenant() tenantId: string,
    @Body() data: { facilityId: string; startDate: string; endDate: string },
  ) {
    return this.schedulerService.generateSchedule(
      tenantId,
      data.facilityId,
      data.startDate,
      data.endDate,
    );
  }

  @Post('save')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async save(
    @CurrentTenant() tenantId: string,
    @Body() data: { facilityId: string; assignments: any[] },
  ) {
    return this.schedulerService.saveGeneratedSchedule(
      tenantId,
      data.facilityId,
      data.assignments,
    );
  }
}
