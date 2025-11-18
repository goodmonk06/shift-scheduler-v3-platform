import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new department' })
  create(@CurrentTenant() tenantId: string, @Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(tenantId, createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiQuery({ name: 'includeHierarchy', required: false, type: Boolean })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('includeHierarchy') includeHierarchy?: string,
  ) {
    return this.departmentService.findAll(tenantId, includeHierarchy === 'true');
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get department hierarchy tree' })
  @ApiQuery({ name: 'rootId', required: false, description: 'Start from specific department' })
  getHierarchy(@CurrentTenant() tenantId: string, @Query('rootId') rootId?: string) {
    return this.departmentService.getHierarchy(tenantId, rootId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id with staff and children' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.departmentService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update department' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, tenantId, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete department (must be empty)' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.departmentService.remove(id, tenantId);
  }

  @Post(':departmentId/staff/:staffId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign staff to department' })
  assignStaff(
    @Param('departmentId') departmentId: string,
    @Param('staffId') staffId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.departmentService.assignStaff(departmentId, staffId, tenantId);
  }

  @Delete('staff/:staffId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Unassign staff from department' })
  unassignStaff(@Param('staffId') staffId: string, @CurrentTenant() tenantId: string) {
    return this.departmentService.unassignStaff(staffId, tenantId);
  }
}
