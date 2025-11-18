import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacilityService } from './facility.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facilities')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create facility' })
  create(@CurrentTenant() tenantId: string, @Body() createFacilityDto: CreateFacilityDto) {
    return this.facilityService.create(tenantId, createFacilityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all facilities' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.facilityService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.facilityService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update facility' })
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() updateData: any) {
    return this.facilityService.update(id, tenantId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete facility' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.facilityService.remove(id, tenantId);
  }
}
