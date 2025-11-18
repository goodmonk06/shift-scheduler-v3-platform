import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveRequestService } from './leave-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.leaveRequestService.create(tenantId, data);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('staffId') staffId?: string) {
    return this.leaveRequestService.findAll(tenantId, staffId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.leaveRequestService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() data: any) {
    return this.leaveRequestService.update(id, tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveRequestService.remove(id);
  }
}
