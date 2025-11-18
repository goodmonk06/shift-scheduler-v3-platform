import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create staff' })
  create(@CurrentTenant() tenantId: string, @Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(tenantId, createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff' })
  @ApiQuery({ name: 'facilityId', required: false })
  findAll(@CurrentTenant() tenantId: string, @Query('facilityId') facilityId?: string) {
    return this.staffService.findAll(tenantId, facilityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update staff' })
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, tenantId, updateStaffDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete staff' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.staffService.remove(id, tenantId);
  }
}
