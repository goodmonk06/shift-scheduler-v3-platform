import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftAssignmentService } from './shift-assignment.service';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Shift Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-assignments')
export class ShiftAssignmentController {
  constructor(private readonly shiftAssignmentService: ShiftAssignmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create shift assignment' })
  create(@CurrentTenant() tenantId: string, @Body() createShiftAssignmentDto: CreateShiftAssignmentDto) {
    return this.shiftAssignmentService.create(tenantId, createShiftAssignmentDto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk create shift assignments' })
  bulkCreate(@CurrentTenant() tenantId: string, @Body() assignments: CreateShiftAssignmentDto[]) {
    return this.shiftAssignmentService.bulkCreate(tenantId, assignments);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift assignments' })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('facilityId') facilityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftAssignmentService.findAll(tenantId, facilityId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift assignment by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.shiftAssignmentService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update shift assignment' })
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() updateData: any) {
    return this.shiftAssignmentService.update(id, tenantId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete shift assignment' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.shiftAssignmentService.remove(id, tenantId);
  }
}
