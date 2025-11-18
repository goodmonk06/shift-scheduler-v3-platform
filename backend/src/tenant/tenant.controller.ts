import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant' })
  async getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantService.findOne(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current tenant' })
  async update(@CurrentTenant() tenantId: string, @Body() updateData: any) {
    return this.tenantService.update(tenantId, updateData);
  }
}
