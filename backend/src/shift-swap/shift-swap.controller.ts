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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftSwapService } from './shift-swap.service';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { RespondToSwapDto } from './dto/respond-to-swap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { UserRole, SwapStatus } from '@prisma/client';

@ApiTags('Shift Swaps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-swaps')
export class ShiftSwapController {
  constructor(private readonly shiftSwapService: ShiftSwapService) {}

  @Post()
  @ApiOperation({ summary: 'Create a shift swap request' })
  create(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Body() createShiftSwapDto: CreateShiftSwapDto,
  ) {
    return this.shiftSwapService.create(tenantId, req.user.userId, createShiftSwapDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift swap requests' })
  @ApiQuery({ name: 'status', required: false, enum: SwapStatus })
  @ApiQuery({ name: 'staffId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: SwapStatus,
    @Query('staffId') staffId?: string,
  ) {
    return this.shiftSwapService.findAll(tenantId, { status, staffId });
  }

  @Get('available/:assignmentId')
  @ApiOperation({ summary: 'Get available shifts for swap' })
  getAvailableShifts(@Param('assignmentId') assignmentId: string, @CurrentTenant() tenantId: string) {
    return this.shiftSwapService.getAvailableShiftsForSwap(assignmentId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift swap request by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.shiftSwapService.findOne(id, tenantId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a shift swap offer (staff action)' })
  acceptOffer(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Body('targetStaffId') targetStaffId: string,
  ) {
    return this.shiftSwapService.acceptOffer(id, tenantId, targetStaffId, req.user.userId);
  }

  @Patch(':id/respond')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve or reject a shift swap request (admin/manager action)' })
  respond(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Body() respondToSwapDto: RespondToSwapDto,
  ) {
    return this.shiftSwapService.respond(id, tenantId, req.user.userId, respondToSwapDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a shift swap request (requester only)' })
  cancel(@Param('id') id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    return this.shiftSwapService.cancel(id, tenantId, req.user.userId);
  }
}
