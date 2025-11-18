import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConstraintRuleService } from './constraint-rule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Constraint Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('constraint-rules')
export class ConstraintRuleController {
  constructor(private readonly constraintRuleService: ConstraintRuleService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.constraintRuleService.create(tenantId, data);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('facilityId') facilityId?: string) {
    return this.constraintRuleService.findAll(tenantId, facilityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.constraintRuleService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() data: any) {
    return this.constraintRuleService.update(id, tenantId, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.constraintRuleService.remove(id);
  }
}
