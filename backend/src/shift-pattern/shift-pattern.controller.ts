import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftPatternService } from './shift-pattern.service';
import { CreateShiftPatternDto } from './dto/create-shift-pattern.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Shift Patterns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-patterns')
export class ShiftPatternController {
  constructor(private readonly shiftPatternService: ShiftPatternService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create shift pattern' })
  create(@CurrentTenant() tenantId: string, @Body() createShiftPatternDto: CreateShiftPatternDto) {
    return this.shiftPatternService.create(tenantId, createShiftPatternDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift patterns' })
  @ApiQuery({ name: 'facilityId', required: false })
  findAll(@CurrentTenant() tenantId: string, @Query('facilityId') facilityId?: string) {
    return this.shiftPatternService.findAll(tenantId, facilityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift pattern by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.shiftPatternService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update shift pattern' })
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() updateData: any) {
    return this.shiftPatternService.update(id, tenantId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete shift pattern' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.shiftPatternService.remove(id, tenantId);
  }
}
